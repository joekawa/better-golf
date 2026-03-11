# Phase 3: Authentication System - COMPLETED

## Overview
Phase 3 has successfully implemented a complete JWT-based authentication system for the Better Golf application using Django REST Framework and SimpleJWT. The system includes user registration, login, logout, token refresh, and user profile management endpoints.

## Completed Tasks

### 1. User Serializers ✅
**Location:** `apps/users/serializers.py`

**Serializers Created:**
- ✅ **UserRegistrationSerializer**
  - Fields: email, username, password, password2
  - Validation: Password matching, Django password validators
  - Auto-creates Profile on user registration
  - Returns user data with JWT tokens

- ✅ **UserSerializer**
  - Fields: id, email, username, is_active, email_verified, last_login, date_joined
  - Read-only fields for security
  - Used for user data responses

- ✅ **ProfileSerializer**
  - All profile fields including nested user data
  - Supports partial updates
  - Handles profile picture uploads

- ✅ **ChangePasswordSerializer**
  - Fields: old_password, new_password, new_password2
  - Password validation and matching

### 2. Authentication Views ✅
**Location:** `apps/users/views.py`

**Views Implemented:**
- ✅ **UserRegistrationView** (`POST /api/auth/register/`)
  - Creates new user account
  - Auto-creates associated profile with default handicap_index=20
  - Returns user data + JWT access and refresh tokens
  - Permission: AllowAny

- ✅ **UserLoginView** (`POST /api/auth/login/`)
  - Authenticates user with email/password
  - Returns JWT access and refresh tokens
  - Extends TokenObtainPairView
  - Permission: AllowAny

- ✅ **UserLogoutView** (`POST /api/auth/logout/`)
  - Blacklists refresh token
  - Invalidates user session
  - Permission: IsAuthenticated

- ✅ **TokenRefreshView** (`POST /api/auth/refresh/`)
  - Refreshes access token using refresh token
  - Built-in SimpleJWT view
  - Permission: AllowAny

- ✅ **CurrentUserView** (`GET /api/auth/me/`)
  - Returns current authenticated user data
  - Permission: IsAuthenticated

- ✅ **CurrentUserProfileView** (`GET/PUT /api/auth/me/profile/`)
  - GET: Returns current user's profile
  - PUT: Updates current user's profile (partial updates supported)
  - Permission: IsAuthenticated

- ✅ **ChangePasswordView** (`POST /api/auth/change-password/`)
  - Changes user password
  - Validates old password
  - Permission: IsAuthenticated

### 3. URL Configuration ✅

**User URLs:** `apps/users/urls.py`
```
POST   /api/auth/register/          - User registration
POST   /api/auth/login/             - User login
POST   /api/auth/logout/            - User logout
POST   /api/auth/refresh/           - Token refresh
GET    /api/auth/me/                - Get current user
GET    /api/auth/me/profile/        - Get current user profile
PUT    /api/auth/me/profile/        - Update current user profile
POST   /api/auth/change-password/   - Change password
```

**Main URLs:** `config/urls.py`
- Included user authentication URLs under `/api/auth/`
- Added media file serving for development

### 4. JWT Configuration ✅
**Location:** `config/settings.py`

**JWT Settings:**
- Access token lifetime: 1 hour
- Refresh token lifetime: 7 days
- Token rotation enabled
- Blacklist after rotation enabled
- Authentication header type: Bearer

**Token Blacklist:**
- Added `rest_framework_simplejwt.token_blacklist` to INSTALLED_APPS
- Migrations applied for token blacklist tables
- Supports logout functionality

### 5. Database Migrations ✅

**Migrations Applied:**
```
token_blacklist.0001_initial through 0012
```

Token blacklist tables created:
- `token_blacklist_outstandingtoken` - Tracks all issued tokens
- `token_blacklist_blacklistedtoken` - Tracks blacklisted tokens

---

## API Endpoints Summary

### Public Endpoints (No Authentication Required)

#### 1. User Registration
```http
POST /api/auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123!",
  "password2": "SecurePass123!"
}

Response 201:
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "is_active": true,
    "email_verified": false,
    "last_login": null,
    "date_joined": "2026-02-24T..."
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### 2. User Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### 3. Token Refresh
```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response 200:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Protected Endpoints (Authentication Required)

**Include in headers:**
```
Authorization: Bearer <access_token>
```

#### 4. User Logout
```http
POST /api/auth/logout/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response 200:
{
  "detail": "Successfully logged out."
}
```

#### 5. Get Current User
```http
GET /api/auth/me/
Authorization: Bearer <access_token>

Response 200:
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "is_active": true,
  "email_verified": false,
  "last_login": "2026-02-24T...",
  "date_joined": "2026-02-24T..."
}
```

#### 6. Get Current User Profile
```http
GET /api/auth/me/profile/
Authorization: Bearer <access_token>

Response 200:
{
  "id": 1,
  "user": { ... },
  "display_name": "",
  "phone_number": "",
  "date_of_birth": null,
  "profile_picture": null,
  "address": "",
  "city": "",
  "state": "",
  "zip": "",
  "country": "",
  "handicap_index": "20.0",
  "ghin_id": "",
  "created_at": "2026-02-24T...",
  "updated_at": "2026-02-24T..."
}
```

#### 7. Update Current User Profile
```http
PUT /api/auth/me/profile/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "John Doe",
  "handicap_index": "15.5",
  "city": "San Francisco",
  "state": "California"
}

Response 200:
{
  "id": 1,
  "user": { ... },
  "display_name": "John Doe",
  "handicap_index": "15.5",
  "city": "San Francisco",
  "state": "California",
  ...
}
```

#### 8. Change Password
```http
POST /api/auth/change-password/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "old_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password2": "NewPass123!"
}

Response 200:
{
  "detail": "Password changed successfully."
}
```

---

## Security Features

### Password Security
- Django's built-in password validation
- Password hashing using PBKDF2
- Password confirmation on registration and change
- Old password verification on password change

### Token Security
- JWT tokens with expiration
- Refresh token rotation
- Token blacklisting on logout
- Bearer token authentication
- Secure token storage requirements (client-side)

### API Security
- Permission classes on all endpoints
- CORS configuration for allowed origins
- CSRF protection
- Authentication required for sensitive endpoints

---

## Profile Auto-Creation

When a user registers:
1. User account is created
2. Profile is automatically created with default values:
   - `handicap_index` = 20.0 (default for users without handicap)
   - `ghin_id` = "" (optional)
   - All other fields empty/null

---

## Testing the Authentication System

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joekawa@yahoo.com",
    "username": "joekawa",
    "password": "Kansas1!",
    "password2": "Kansas1!"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

### Using Django Shell
```python
from apps.users.models import CustomUser, Profile

# Check user was created with profile
user = CustomUser.objects.get(email='test@example.com')
print(user.profile.handicap_index)  # Should print 20.0
```

---

## Files Created/Modified

### New Files
- `backend/apps/users/serializers.py` - User and profile serializers
- `backend/apps/users/urls.py` - Authentication URL routing

### Modified Files
- `backend/apps/users/views.py` - Authentication views
- `backend/config/urls.py` - Main URL configuration
- `backend/config/settings.py` - Added token_blacklist app

### Migrations
- Token blacklist migrations (0001-0012) applied

---

## Next Steps (Phase 4)

Phase 4 will focus on Profile Management enhancements:
1. Profile picture upload handling
2. Profile validation and business logic
3. Additional profile endpoints if needed

However, basic profile management is already complete as part of Phase 3:
- Profile auto-creation on registration ✓
- Get profile endpoint ✓
- Update profile endpoint ✓

The main focus will shift to:
- **Phase 5:** Course Integration (Golf Course API)
- **Phase 6:** Round Tracking
- **Phase 7:** Statistics Engine

---

## Phase 3 Status: ✅ COMPLETE

The authentication system is fully functional with JWT-based security, user registration, login, logout, token refresh, and profile management. All endpoints are tested and ready for frontend/mobile integration.

**Estimated Time:** Phase 3 completed
**Next Phase:** Phase 4 - Profile Management (mostly complete) or Phase 5 - Course Integration
