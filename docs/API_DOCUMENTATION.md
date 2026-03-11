# Better Golf API Documentation

## Base URL
```
Development: http://localhost:8000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Endpoints

#### Register User
```http
POST /auth/register/
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "is_active": true,
    "email_verified": false
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Notes:**
- Username is auto-generated from email (part before @)
- If username exists, appends number (user1, user2, etc.)
- Profile is automatically created with default handicap of 20.0

---

#### Login
```http
POST /auth/login/
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

#### Logout
```http
POST /auth/logout/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "detail": "Successfully logged out."
}
```

**Notes:**
- Blacklists the refresh token
- Requires authentication

---

#### Refresh Token
```http
POST /auth/token/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## User & Profile Endpoints

#### Get Current User
```http
GET /auth/me/
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "user",
  "is_active": true,
  "email_verified": false,
  "last_login": "2024-01-15T10:30:00Z",
  "date_joined": "2024-01-01T08:00:00Z"
}
```

---

#### Get Current User Profile
```http
GET /auth/me/profile/
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user"
  },
  "display_name": "John Doe",
  "phone_number": "555-1234",
  "date_of_birth": "1990-01-15",
  "profile_picture": null,
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip": "94102",
  "country": "USA",
  "handicap_index": "15.5",
  "ghin_id": "1234567",
  "created_at": "2024-01-01T08:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

#### Update Profile
```http
PUT /auth/me/profile/
```

**Request Body:**
```json
{
  "display_name": "John Doe",
  "phone_number": "555-1234",
  "handicap_index": "12.3",
  "ghin_id": "1234567",
  "date_of_birth": "1990-01-15"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "display_name": "John Doe",
  "phone_number": "555-1234",
  "handicap_index": "12.3",
  ...
}
```

---

## Course Endpoints

#### List Courses
```http
GET /courses/
```

**Query Parameters:**
- `city` (optional): Filter by city
- `state` (optional): Filter by state
- `name` (optional): Search by name
- `page` (optional): Page number for pagination
- `page_size` (optional): Items per page (default: 10)

**Response:** `200 OK`
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/courses/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Pebble Beach Golf Links",
      "city": "Pebble Beach",
      "state": "CA",
      "address": "1700 17 Mile Dr",
      "country": "USA",
      "created_at": "2024-01-01T08:00:00Z"
    }
  ]
}
```

---

#### Get Course Details
```http
GET /courses/{id}/
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Pebble Beach Golf Links",
  "city": "Pebble Beach",
  "state": "CA",
  "address": "1700 17 Mile Dr",
  "country": "USA",
  "tees": [
    {
      "id": 1,
      "name": "Blue",
      "slope": 142,
      "rating": 75.5,
      "par": 72,
      "handicap": null
    }
  ],
  "created_at": "2024-01-01T08:00:00Z"
}
```

---

#### Get Course Tees
```http
GET /courses/{id}/tees/
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Blue",
    "slope": 142,
    "rating": 75.5,
    "par": 72,
    "handicap": null,
    "holes": [
      {
        "id": 1,
        "hole_number": 1,
        "par": 4,
        "distance": 420
      }
    ]
  }
]
```

---

#### Search Courses (External API)
```http
GET /courses/search/?query=pebble
```

**Query Parameters:**
- `query` (required): Search term
- `limit` (optional): Max results (default: 20)

**Response:** `200 OK`
```json
[
  {
    "id": 12345,
    "name": "Pebble Beach Golf Links",
    "city": "Pebble Beach",
    "state": "CA",
    "country": "USA"
  }
]
```

---

#### Save Course from External API
```http
POST /courses/save/
```

**Request Body:**
```json
{
  "api_course_id": 12345
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Pebble Beach Golf Links",
  "city": "Pebble Beach",
  "state": "CA",
  "country": "USA"
}
```

---

## Round Endpoints

#### List Rounds
```http
GET /rounds/
```

**Query Parameters:**
- `course` (optional): Filter by course ID
- `date_from` (optional): Filter by start date (YYYY-MM-DD)
- `date_to` (optional): Filter by end date (YYYY-MM-DD)
- `score_type` (optional): Filter by score type (0=Total, 1=Hole-by-Hole)
- `ordering` (optional): Order by field (e.g., `-date` for newest first)

**Response:** `200 OK`
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "course_name": "Pebble Beach Golf Links",
      "tee_name": "Blue",
      "date": "2024-01-15",
      "score_type": 0,
      "score_type_display": "Total Score",
      "gross_score": 85,
      "net_score": 75,
      "created_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

---

#### Create Round (Total Score)
```http
POST /rounds/
```

**Request Body:**
```json
{
  "course": 1,
  "tee": 1,
  "date": "2024-01-15",
  "score_type": 0,
  "gross_score": 85,
  "net_score": 75
}
```

**Response:** `201 Created`

---

#### Create Round (Hole-by-Hole)
```http
POST /rounds/
```

**Request Body:**
```json
{
  "course": 1,
  "tee": 1,
  "date": "2024-01-15",
  "score_type": 1,
  "hole_scores": [
    {
      "hole": 1,
      "strokes": 5,
      "putts": 2,
      "fairway_hit": true,
      "gir": false
    },
    ...
  ]
}
```

**Notes:**
- Must provide exactly 18 hole scores
- Gross and net scores are auto-calculated
- Uses user's handicap index for net score calculation

**Response:** `201 Created`

---

#### Get Round Details
```http
GET /rounds/{id}/
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "course": {
    "id": 1,
    "name": "Pebble Beach Golf Links"
  },
  "tee": {
    "id": 1,
    "name": "Blue",
    "rating": 75.5,
    "slope": 142
  },
  "date": "2024-01-15",
  "score_type": 0,
  "score_type_display": "Total Score",
  "score": {
    "gross_score": 85,
    "net_score": 75,
    "adjusted_gross_score": null
  },
  "created_at": "2024-01-15T14:30:00Z"
}
```

---

#### Get Round Hole Scores
```http
GET /rounds/{id}/hole_scores/
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "hole": {
      "hole_number": 1,
      "par": 4,
      "distance": 420
    },
    "strokes": 5,
    "putts": 2,
    "fairway_hit": true,
    "gir": false
  }
]
```

---

#### Get Recent Rounds
```http
GET /rounds/recent/?limit=5
```

**Query Parameters:**
- `limit` (optional): Number of rounds (default: 10)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "course_name": "Pebble Beach Golf Links",
    "date": "2024-01-15",
    "gross_score": 85
  }
]
```

---

#### Get Rounds Stats Summary
```http
GET /rounds/stats_summary/
```

**Response:** `200 OK`
```json
{
  "total_rounds": 25,
  "average_score": 82.5,
  "best_score": 75,
  "worst_score": 95,
  "total_holes_played": 450
}
```

---

## Statistics Endpoints

#### List Stats
```http
GET /stats/
```

**Query Parameters:**
- `round` (optional): Filter by round ID
- `date_from` (optional): Filter by start date
- `date_to` (optional): Filter by end date

**Response:** `200 OK`
```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "round": 1,
      "fairways_hit": 10,
      "greens_in_regulation": 12,
      "total_putts": 32,
      "fairway_percentage": 71.4,
      "gir_percentage": 66.7,
      "putts_per_hole": 1.78,
      "eagles": 0,
      "birdies": 2,
      "pars": 10,
      "bogeys": 4,
      "double_bogeys": 2,
      "created_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

---

#### Create Stats
```http
POST /stats/
```

**Request Body:**
```json
{
  "round": 1,
  "fairways_hit": 10,
  "greens_in_regulation": 12,
  "total_putts": 32,
  "eagles": 0,
  "birdies": 2,
  "pars": 10,
  "bogeys": 4,
  "double_bogeys": 2
}
```

**Response:** `201 Created`

---

#### Auto-Calculate Stats from Hole Scores
```http
POST /stats/calculate/{round_id}/
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "fairways_hit": 10,
  "greens_in_regulation": 12,
  "total_putts": 32,
  "eagles": 0,
  "birdies": 2,
  "pars": 10,
  "bogeys": 4,
  "double_bogeys": 2
}
```

**Notes:**
- Only works for hole-by-hole rounds
- Automatically counts scoring categories based on par

---

#### Get Aggregate Stats
```http
GET /stats/aggregate/
```

**Query Parameters:**
- `date_from` (optional): Start date (YYYY-MM-DD)
- `date_to` (optional): End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "total_rounds": 25,
  "avg_fairways_hit": 10.2,
  "avg_greens_in_regulation": 11.8,
  "avg_putts": 31.5,
  "fairway_percentage": 72.9,
  "gir_percentage": 65.6,
  "putts_per_hole": 1.75,
  "total_eagles": 1,
  "total_birdies": 45,
  "total_pars": 250,
  "total_bogeys": 100,
  "total_double_bogeys": 54
}
```

---

#### Get Performance Trends
```http
GET /stats/trends/?limit=10
```

**Query Parameters:**
- `limit` (optional): Number of rounds (default: 10)

**Response:** `200 OK`
```json
[
  {
    "date": "2024-01-15",
    "score": 85,
    "fairways_hit": 10,
    "gir": 12,
    "putts": 32,
    "fairway_percentage": 71.4,
    "gir_percentage": 66.7,
    "putts_per_hole": 1.78
  }
]
```

---

#### Get Best Stats
```http
GET /stats/best/
```

**Response:** `200 OK`
```json
{
  "best_fairways_hit": {
    "value": 14,
    "date": "2024-01-10"
  },
  "best_gir": {
    "value": 16,
    "date": "2024-01-12"
  },
  "best_putts": {
    "value": 26,
    "date": "2024-01-08"
  },
  "most_birdies": {
    "value": 4,
    "date": "2024-01-12"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"],
  "non_field_errors": ["General error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error."
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider implementing rate limiting using Django REST Framework throttling.

## Pagination

All list endpoints use cursor pagination with the following structure:

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

Default page size: 10
Maximum page size: 100

## CORS

CORS is configured to allow requests from:
- `http://localhost:5173` (Frontend dev server)
- `http://localhost:5174` (Alternative frontend port)
- `http://localhost:19006` (Expo dev server)

For production, update `CORS_ALLOWED_ORIGINS` in settings.

## Notes

- All dates are in ISO 8601 format (YYYY-MM-DD)
- All timestamps are in ISO 8601 format with timezone (YYYY-MM-DDTHH:MM:SSZ)
- All authenticated endpoints require valid JWT access token
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- User data is isolated - users can only access their own data
