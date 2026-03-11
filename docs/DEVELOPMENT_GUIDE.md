# Better Golf - Development Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Mobile Development](#mobile-development)
6. [Testing](#testing)
7. [Code Style & Standards](#code-style--standards)
8. [Git Workflow](#git-workflow)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Python 3.13+**: Backend development
- **Node.js 18+**: Frontend and mobile development
- **PostgreSQL 14+**: Database (optional for development, SQLite is default)
- **Git**: Version control
- **VS Code** or similar IDE

### Recommended Tools
- **Postman** or **Insomnia**: API testing
- **pgAdmin**: PostgreSQL management
- **React DevTools**: Browser extension for React debugging
- **Redux DevTools**: If using Redux (future enhancement)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd better-golf
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# At minimum, set:
# - SECRET_KEY (generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
# - GOLF_COURSE_API_KEY (get from https://api.golfcourseapi.com)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env
# Set VITE_API_URL=http://localhost:8000/api

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 4. Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan QR code with Expo Go app on your mobile device.

---

## Backend Development

### Project Structure

```
backend/
├── apps/
│   ├── users/          # User authentication and profiles
│   ├── courses/        # Golf courses and tees
│   ├── rounds/         # Round tracking
│   ├── stats/          # Statistics engine
│   └── utils/          # Shared utilities
├── config/             # Django settings and URLs
├── media/              # User-uploaded files
├── staticfiles/        # Collected static files
├── manage.py           # Django management script
└── requirements.txt    # Python dependencies
```

### Creating a New App

```bash
cd backend
source venv/bin/activate
python manage.py startapp app_name apps/app_name
```

Then add to `INSTALLED_APPS` in `config/settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'apps.app_name',
]
```

### Creating Models

All models should extend `BaseModel` from `apps.utils.models`:

```python
from apps.utils.models import BaseModel
from django.db import models

class MyModel(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-created_at']
```

### Creating Serializers

```python
from rest_framework import serializers
from .models import MyModel

class MyModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Name must be at least 3 characters")
        return value
```

### Creating Views

```python
from rest_framework import viewsets, permissions
from .models import MyModel
from .serializers import MyModelSerializer

class MyModelViewSet(viewsets.ModelViewSet):
    serializer_class = MyModelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # User isolation - only show user's own data
        return MyModel.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Automatically set user on creation
        serializer.save(user=self.request.user)
```

### URL Configuration

```python
# apps/myapp/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyModelViewSet

router = DefaultRouter()
router.register(r'mymodels', MyModelViewSet, basename='mymodel')

urlpatterns = [
    path('', include(router.urls)),
]

# config/urls.py
urlpatterns = [
    # ...
    path('api/myapp/', include('apps.myapp.urls')),
]
```

### Database Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create empty migration for data population
python manage.py makemigrations --empty app_name

# Rollback migration
python manage.py migrate app_name previous_migration_name
```

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.users

# Run with verbosity
python manage.py test --verbosity=2

# Run specific test class
python manage.py test apps.users.tests.test_api.UserRegistrationAPITest

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Django Admin

Access admin panel at `http://localhost:8000/admin/`

Register models in `admin.py`:
```python
from django.contrib import admin
from .models import MyModel

@admin.register(MyModel)
class MyModelAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']
    ordering = ['-created_at']
```

### Common Django Commands

```bash
# Create superuser
python manage.py createsuperuser

# Shell with Django context
python manage.py shell

# Database shell
python manage.py dbshell

# Check for issues
python manage.py check

# Show migrations
python manage.py showmigrations

# Collect static files
python manage.py collectstatic
```

---

## Frontend Development

### Project Structure

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   │   ├── auth/       # Authentication components
│   │   ├── profile/    # Profile components
│   │   ├── rounds/     # Round components
│   │   └── stats/      # Statistics components
│   ├── contexts/       # React contexts
│   ├── lib/            # Utilities and API client
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── index.html          # HTML template
├── package.json        # Dependencies
└── vite.config.ts      # Vite configuration
```

### Creating Components

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch data
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {/* Component content */}
    </div>
  );
};
```

### API Calls

Use the configured API client from `src/lib/api.ts`:

```typescript
import { api } from '../../lib/api';

// GET request
const response = await api.get('/endpoint/');
const data = response.data;

// POST request
const response = await api.post('/endpoint/', {
  field: 'value'
});

// PUT request
const response = await api.put('/endpoint/1/', {
  field: 'updated value'
});

// DELETE request
await api.delete('/endpoint/1/');
```

### Styling with Tailwind

```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Title</h2>
  <p className="text-gray-600">Content</p>
  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
    Action
  </button>
</div>
```

### Routing

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginForm />} />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
    <Route path="/" element={<Navigate to="/dashboard" />} />
  </Routes>
</BrowserRouter>
```

### Common npm Commands

```bash
# Install dependencies
npm install

# Add new dependency
npm install package-name

# Add dev dependency
npm install -D package-name

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

---

## Mobile Development

### Project Structure

```
mobile/
├── app/                # Expo Router app directory
├── assets/             # Images, fonts, etc.
├── contexts/           # React contexts
├── components/         # Reusable components
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

### Expo Commands

```bash
# Start development server
npx expo start

# Start with clear cache
npx expo start -c

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### AsyncStorage Usage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
await AsyncStorage.setItem('key', 'value');

// Get data
const value = await AsyncStorage.getItem('key');

// Remove data
await AsyncStorage.removeItem('key');

// Clear all data
await AsyncStorage.clear();
```

---

## Testing

### Backend Tests

Create tests in `apps/<app_name>/tests/`:

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class MyModelAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_items(self):
        response = self.client.get('/api/myapp/mymodels/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_item(self):
        data = {'name': 'Test Item'}
        response = self.client.post('/api/myapp/mymodels/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

### Frontend Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
  
  it('handles button click', () => {
    const handleClick = jest.fn();
    render(<MyComponent title="Test" onAction={handleClick} />);
    fireEvent.click(screen.getByText('Action'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## Code Style & Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where appropriate
- Maximum line length: 100 characters
- Use docstrings for functions and classes
- Import order: standard library, third-party, local

```python
from typing import List, Optional
from django.db import models

def calculate_handicap(scores: List[int], course_rating: float) -> float:
    """
    Calculate handicap index from recent scores.
    
    Args:
        scores: List of recent gross scores
        course_rating: Course rating value
        
    Returns:
        Calculated handicap index
    """
    # Implementation
    pass
```

### TypeScript (Frontend/Mobile)

- Use TypeScript strict mode
- Define interfaces for all props and data structures
- Use functional components with hooks
- Prefer const over let
- Use arrow functions

```typescript
interface User {
  id: number;
  email: string;
  username: string;
}

const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<string>('');
  
  const handleAction = (): void => {
    // Implementation
  };
  
  return <div>{/* JSX */}</div>;
};
```

### Tailwind CSS

- Use established design system
- No hard-coded colors, sizes, or fonts
- Mobile-first approach
- Use Poppins font family

```tsx
// Good
<div className="bg-white text-gray-900 font-poppins">

// Bad
<div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
```

---

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent production fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add password reset functionality
fix(rounds): correct handicap calculation for 9-hole rounds
docs(api): update endpoint documentation
```

### Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat(scope): description"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub

# After review and approval, merge to main
```

---

## Troubleshooting

### Backend Issues

#### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

#### Database Migration Errors
```bash
# Reset migrations (development only)
python manage.py migrate <app> zero
python manage.py migrate <app>

# Or delete database and start fresh
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

#### Module Import Errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

#### Node Version Issues
```bash
# Check Node version
node --version

# Use nvm to switch versions
nvm use 18
```

#### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Mobile Issues

#### Expo Cache Issues
```bash
# Clear Expo cache
npx expo start -c

# Clear watchman cache
watchman watch-del-all
```

#### Metro Bundler Issues
```bash
# Reset Metro bundler
npx expo start --clear
```

---

## Environment Variables Reference

### Backend (.env)

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_ENGINE=django.db.backends.sqlite3
DATABASE_NAME=db.sqlite3

# Golf Course API
GOLF_COURSE_API_KEY=your-api-key
GOLF_COURSE_API_URL=https://api.golfcourseapi.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:19006
CORS_ALLOW_ALL_ORIGINS=True
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

### Mobile (app.json)

```json
{
  "extra": {
    "apiUrl": "http://localhost:8000/api"
  }
}
```

---

## Additional Resources

### Documentation
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Expo Documentation](https://docs.expo.dev/)

### Tools
- [Postman](https://www.postman.com/)
- [pgAdmin](https://www.pgadmin.org/)
- [VS Code](https://code.visualstudio.com/)

### Community
- Django Discord
- React Discord
- Stack Overflow

---

## Getting Help

1. Check this development guide
2. Review API documentation
3. Check application logs
4. Search existing issues on GitHub
5. Ask team members
6. Create new GitHub issue with details
