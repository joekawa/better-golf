# Better Golf - Deployment Guide

## Overview

This guide covers deploying the Better Golf application to production. The application consists of three components:
- Django REST API (Backend)
- React Web Application (Frontend)
- Expo Mobile Application (Mobile)

## Prerequisites

- Domain name configured with DNS
- SSL certificate (Let's Encrypt recommended)
- Server with Ubuntu 20.04+ or similar
- PostgreSQL database
- Node.js 18+ and Python 3.13+
- Git access to repository

## Backend Deployment (Django)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3.13 python3.13-venv python3-pip postgresql postgresql-contrib nginx supervisor -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. PostgreSQL Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE bettergolf;
CREATE USER bettergolfuser WITH PASSWORD 'your-secure-password';
ALTER ROLE bettergolfuser SET client_encoding TO 'utf8';
ALTER ROLE bettergolfuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE bettergolfuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE bettergolf TO bettergolfuser;
\q
```

### 3. Application Setup

```bash
# Create application directory
sudo mkdir -p /var/www/bettergolf
sudo chown $USER:$USER /var/www/bettergolf
cd /var/www/bettergolf

# Clone repository
git clone <your-repo-url> .

# Create virtual environment
cd backend
python3.13 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

### 4. Environment Configuration

Create `/var/www/bettergolf/backend/.env`:

```env
SECRET_KEY=your-very-long-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=bettergolf
DATABASE_USER=bettergolfuser
DATABASE_PASSWORD=your-secure-password
DATABASE_HOST=localhost
DATABASE_PORT=5432

GOLF_COURSE_API_KEY=your-golf-course-api-key
GOLF_COURSE_API_URL=https://api.golfcourseapi.com

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_ALL_ORIGINS=False

# Email settings (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 5. Django Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Test the application
python manage.py runserver 0.0.0.0:8000
```

### 6. Gunicorn Configuration

Create `/var/www/bettergolf/backend/gunicorn_config.py`:

```python
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
errorlog = "/var/log/gunicorn/error.log"
accesslog = "/var/log/gunicorn/access.log"
loglevel = "info"
```

Create log directory:
```bash
sudo mkdir -p /var/log/gunicorn
sudo chown $USER:$USER /var/log/gunicorn
```

### 7. Supervisor Configuration

Create `/etc/supervisor/conf.d/bettergolf.conf`:

```ini
[program:bettergolf]
directory=/var/www/bettergolf/backend
command=/var/www/bettergolf/backend/venv/bin/gunicorn config.wsgi:application -c gunicorn_config.py
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/bettergolf.log
```

Start the service:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start bettergolf
sudo supervisorctl status bettergolf
```

### 8. Nginx Configuration

Create `/etc/nginx/sites-available/bettergolf`:

```nginx
upstream bettergolf_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API endpoints
    location /api/ {
        proxy_pass http://bettergolf_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Admin panel
    location /admin/ {
        proxy_pass http://bettergolf_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /var/www/bettergolf/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /var/www/bettergolf/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend (React app)
    location / {
        root /var/www/bettergolf/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/bettergolf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to configure SSL.

---

## Frontend Deployment (React)

### 1. Build Configuration

Update `/var/www/bettergolf/frontend/.env.production`:

```env
VITE_API_URL=https://yourdomain.com/api
```

### 2. Build the Application

```bash
cd /var/www/bettergolf/frontend
npm install
npm run build
```

The build output will be in the `dist` directory, which Nginx is configured to serve.

### 3. Optimize Build

For production optimization, ensure `vite.config.ts` includes:

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios'],
        },
      },
    },
  },
});
```

---

## Mobile Deployment (Expo)

### 1. Configure App

Update `mobile/app.json`:

```json
{
  "expo": {
    "name": "Better Golf",
    "slug": "better-golf",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourdomain.bettergolf"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourdomain.bettergolf"
    },
    "extra": {
      "apiUrl": "https://yourdomain.com/api"
    }
  }
}
```

### 2. Build for iOS

```bash
cd mobile
eas build --platform ios
```

Follow the prompts and submit to App Store Connect.

### 3. Build for Android

```bash
eas build --platform android
```

Follow the prompts and submit to Google Play Console.

---

## Continuous Deployment

### 1. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/bettergolf
            git pull origin main
            cd backend
            source venv/bin/activate
            pip install -r requirements.txt
            python manage.py migrate
            python manage.py collectstatic --noinput
            sudo supervisorctl restart bettergolf
            
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build
          
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "frontend/dist/*"
          target: "/var/www/bettergolf/frontend/"
```

---

## Monitoring & Maintenance

### 1. Log Monitoring

```bash
# Gunicorn logs
tail -f /var/log/gunicorn/error.log
tail -f /var/log/gunicorn/access.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Supervisor logs
tail -f /var/log/supervisor/bettergolf.log
```

### 2. Database Backups

Create `/usr/local/bin/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/bettergolf"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U bettergolfuser bettergolf > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup-db.sh
```

### 3. Health Checks

Create a health check endpoint in Django:

```python
# backend/config/urls.py
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'healthy'})

urlpatterns = [
    path('health/', health_check),
    # ... other patterns
]
```

### 4. Performance Monitoring

Consider integrating:
- **Sentry** for error tracking
- **New Relic** or **DataDog** for APM
- **Uptime Robot** for uptime monitoring

---

## Security Checklist

- [ ] DEBUG=False in production
- [ ] Strong SECRET_KEY (50+ characters)
- [ ] ALLOWED_HOSTS configured correctly
- [ ] CORS_ALLOWED_ORIGINS set to specific domains
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Database password is strong and secure
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key-based authentication only
- [ ] Regular security updates applied
- [ ] Database backups automated
- [ ] Environment variables not committed to git
- [ ] Admin panel accessible only via HTTPS
- [ ] Rate limiting configured
- [ ] CSRF protection enabled
- [ ] XSS protection headers set

---

## Troubleshooting

### Backend not starting
```bash
# Check supervisor status
sudo supervisorctl status bettergolf

# Check logs
tail -f /var/log/supervisor/bettergolf.log

# Restart service
sudo supervisorctl restart bettergolf
```

### Database connection errors
```bash
# Test database connection
sudo -u postgres psql -d bettergolf -U bettergolfuser

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Static files not loading
```bash
# Recollect static files
cd /var/www/bettergolf/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Check permissions
ls -la staticfiles/
```

### 502 Bad Gateway
```bash
# Check if Gunicorn is running
sudo supervisorctl status bettergolf

# Check Nginx configuration
sudo nginx -t

# Check upstream connection
curl http://127.0.0.1:8000/api/
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Revert code
cd /var/www/bettergolf
git log --oneline
git checkout <previous-commit-hash>

# 2. Revert migrations (if needed)
cd backend
source venv/bin/activate
python manage.py migrate <app_name> <migration_number>

# 3. Restart services
sudo supervisorctl restart bettergolf
sudo systemctl restart nginx
```

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (HAProxy or AWS ELB)
- Multiple application servers
- Shared PostgreSQL database
- Redis for session storage and caching

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching (Redis/Memcached)
- Use CDN for static assets

### Database Optimization
- Connection pooling (pgBouncer)
- Read replicas for reporting
- Database indexing
- Query optimization

---

## Alternative Deployment Options

### Platform as a Service (PaaS)

#### Heroku
- Easy deployment with git push
- Automatic SSL
- Add-ons for PostgreSQL, Redis
- Higher cost for production

#### Railway
- Modern PaaS alternative
- Automatic deployments from GitHub
- Built-in PostgreSQL
- Competitive pricing

#### Render
- Free tier available
- Automatic SSL
- PostgreSQL included
- Easy configuration

### Container Deployment

#### Docker + Docker Compose
See separate Docker deployment guide

#### Kubernetes
For large-scale deployments with high availability requirements

---

## Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] API endpoints responding correctly
- [ ] Frontend loads and functions properly
- [ ] Database migrations applied
- [ ] Static files serving correctly
- [ ] Media uploads working
- [ ] Email notifications working (if configured)
- [ ] Monitoring and logging configured
- [ ] Backups automated and tested
- [ ] SSL certificate auto-renewal configured
- [ ] DNS records configured correctly
- [ ] Mobile app submitted to app stores
- [ ] Documentation updated with production URLs
- [ ] Team notified of deployment

---

## Support

For deployment issues:
1. Check application logs
2. Review this deployment guide
3. Consult Django and Nginx documentation
4. Contact system administrator
