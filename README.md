# Better Golf

A mobile-first golf tracking application that helps golfers track their game and improve their performance.

## Project Structure

```
better-golf/
├── backend/          # Django REST API
├── frontend/         # React web application
├── mobile/           # Expo mobile application
└── docs/            # Project documentation
```

## Tech Stack

### Backend
- Django 5.0.1
- Django REST Framework
- SimpleJWT for authentication
- PostgreSQL (production) / SQLite (development)
- Python 3.13

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Mobile
- Expo
- React Native
- TypeScript
- NativeWind (Tailwind for React Native)

## Getting Started

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The backend will run on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will run on `http://localhost:5173`

### Mobile Setup

```bash
cd mobile
npm install
npx expo start
```

## Environment Variables

### Backend (.env)
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `DATABASE_ENGINE`: Database engine
- `DATABASE_NAME`: Database name
- `GOLF_COURSE_API_KEY`: Golf Course API key
- `CORS_ALLOWED_ORIGINS`: Allowed CORS origins

### Frontend (.env)
- `VITE_API_URL`: Backend API URL

## Features (MVP)

- User registration and authentication
- Profile management with handicap tracking
- Course search and selection (via Golf Course API)
- Round tracking (total score and hole-by-hole)
- Statistics dashboard
- Mobile-first responsive design

## Development Guidelines

- Follow established linting and formatting rules
- Write tests for all new features
- Use the established color, size, and font palettes
- No emojis or icons in the UI
- Ensure consistent experience between desktop and mobile
- Log extensively for debugging

## API Documentation

API documentation will be available at `http://localhost:8000/api/docs/` once the backend is running.

## License

Proprietary
