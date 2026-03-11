# Phase 4 & 5: Profile Management and Course Integration - COMPLETED

## Overview
Phase 4 and 5 have been successfully completed together. Phase 4 (Profile Management) was largely completed during Phase 3 with the authentication system. Phase 5 focuses on integrating the Golf Course API (https://api.golfcourseapi.com) to enable course search, retrieval, and local storage of golf course data.

## Completed Tasks

### Phase 4: Profile Management ✅

**Note:** Profile management was implemented in Phase 3 as part of the authentication system.

**Features Completed:**
- ✅ Profile auto-creation on user registration
- ✅ Default handicap_index = 20.0 for new users
- ✅ Optional GHIN ID field
- ✅ Profile retrieval endpoint (`GET /api/auth/me/profile/`)
- ✅ Profile update endpoint (`PUT /api/auth/me/profile/`)
- ✅ Profile picture upload support
- ✅ All profile fields (address, city, state, zip, country, phone, DOB)

**Endpoints Available:**
```
GET    /api/auth/me/profile/     - Get current user's profile
PUT    /api/auth/me/profile/     - Update current user's profile
```

**Profile Fields:**
- User information (email, username)
- Display name
- Contact info (phone, address, city, state, zip, country)
- Golf info (handicap_index, ghin_id)
- Profile picture
- Timestamps (created_at, updated_at)

---

### Phase 5: Course Integration ✅

**Location:** `apps/courses/`

#### 1. Course Serializers ✅
**File:** `apps/courses/serializers.py`

**Serializers Created:**
- ✅ **HoleSerializer**
  - Fields: id, hole_number, par, distance, timestamps
  - Used for hole data representation
  
- ✅ **CourseTeeSerializer**
  - Fields: id, name, slope, rating, par, handicap, holes, timestamps
  - Includes nested hole data
  
- ✅ **CourseSerializer**
  - Fields: id, name, city, state, address, country, tees, timestamps
  - Full course details with nested tees and holes
  
- ✅ **CourseListSerializer**
  - Lightweight serializer for course lists
  - Fields: id, name, city, state, country
  
- ✅ **CourseTeeListSerializer**
  - Lightweight serializer for tee lists
  - Fields: id, course_name, name, slope, rating, par

#### 2. Golf Course API Service ✅
**File:** `apps/courses/services.py`

**GolfCourseAPIService Class:**
- ✅ **search_courses(query, limit=20)**
  - Searches Golf Course API by name, city, or state
  - Returns list of matching courses
  - Handles API errors gracefully
  
- ✅ **get_course_details(course_id)**
  - Retrieves detailed course information from API
  - Includes tees and holes data
  - Returns course data or None on error
  
- ✅ **save_course_to_db(api_course_data)**
  - Saves course data from API to local database
  - Creates/updates Course, CourseTee, and Hole records
  - Uses update_or_create for idempotency
  - Returns saved Course instance

**API Configuration:**
- API Key: Stored in `GOLF_COURSE_API_KEY` environment variable
- Base URL: Stored in `GOLF_COURSE_API_URL` environment variable
- Default: https://api.golfcourseapi.com
- Authentication: Bearer token
- Timeout: 10 seconds
- Error handling: Comprehensive logging and exception handling

#### 3. Course ViewSets and Views ✅
**File:** `apps/courses/views.py`

**ViewSets:**
- ✅ **CourseViewSet** (Full CRUD)
  - List, Create, Retrieve, Update, Delete courses
  - Search functionality via `?search=query`
  - Custom actions:
    - `GET /api/courses/{id}/tees/` - Get course tees
    - `GET /api/courses/{id}/holes/?tee_id=X` - Get course holes
  - Permission: IsAuthenticated
  
- ✅ **CourseTeeViewSet** (Read-only)
  - List and retrieve tees
  - Filter by course: `?course_id=X`
  - Permission: IsAuthenticated
  
- ✅ **HoleViewSet** (Read-only)
  - List and retrieve holes
  - Filter by course: `?course_id=X`
  - Filter by tee: `?tee_id=X`
  - Permission: IsAuthenticated

**API Views:**
- ✅ **CourseSearchAPIView**
  - `GET /api/search/?q=query` - Search Golf Course API
  - Returns external API results
  - Does not save to database
  - Permission: IsAuthenticated
  
- ✅ **CourseSaveFromAPIView**
  - `POST /api/save/` with `course_id` - Save course from API to DB
  - Fetches course details from Golf Course API
  - Saves to local database
  - Returns saved course data
  - Permission: IsAuthenticated

#### 4. URL Configuration ✅
**File:** `apps/courses/urls.py`

**Course API Endpoints:**
```
GET    /api/courses/                    - List all courses
POST   /api/courses/                    - Create course
GET    /api/courses/{id}/               - Get course details
PUT    /api/courses/{id}/               - Update course
DELETE /api/courses/{id}/               - Delete course
GET    /api/courses/{id}/tees/          - Get course tees
GET    /api/courses/{id}/holes/         - Get course holes
GET    /api/courses/?search=query       - Search local courses

GET    /api/tees/                       - List all tees
GET    /api/tees/{id}/                  - Get tee details
GET    /api/tees/?course_id=X           - Filter tees by course

GET    /api/holes/                      - List all holes
GET    /api/holes/{id}/                 - Get hole details
GET    /api/holes/?course_id=X          - Filter holes by course
GET    /api/holes/?tee_id=X             - Filter holes by tee

GET    /api/search/?q=query             - Search Golf Course API
POST   /api/save/                       - Save course from API
```

**Main URLs Updated:**
- Added `path('api/', include('apps.courses.urls'))` to `config/urls.py`

---

## API Usage Examples

### 1. Search Golf Course API
```http
GET /api/search/?q=Pebble Beach
Authorization: Bearer <access_token>

Response 200:
{
  "count": 5,
  "results": [
    {
      "id": "12345",
      "name": "Pebble Beach Golf Links",
      "city": "Pebble Beach",
      "state": "California",
      "country": "USA",
      ...
    },
    ...
  ]
}
```

### 2. Save Course from API to Database
```http
POST /api/save/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "course_id": "12345"
}

Response 201:
{
  "id": 1,
  "name": "Pebble Beach Golf Links",
  "city": "Pebble Beach",
  "state": "California",
  "address": "1700 17 Mile Dr",
  "country": "USA",
  "tees": [
    {
      "id": 1,
      "name": "Championship",
      "slope": 145.0,
      "rating": 75.5,
      "par": 72,
      "holes": [
        {
          "id": 1,
          "hole_number": 1,
          "par": 4,
          "distance": 380
        },
        ...
      ]
    }
  ],
  "created_at": "2026-02-24T...",
  "updated_at": "2026-02-24T..."
}
```

### 3. List Local Courses
```http
GET /api/courses/
Authorization: Bearer <access_token>

Response 200:
[
  {
    "id": 1,
    "name": "Pebble Beach Golf Links",
    "city": "Pebble Beach",
    "state": "California",
    "country": "USA"
  },
  ...
]
```

### 4. Search Local Courses
```http
GET /api/courses/?search=Pebble
Authorization: Bearer <access_token>

Response 200:
[
  {
    "id": 1,
    "name": "Pebble Beach Golf Links",
    "city": "Pebble Beach",
    "state": "California",
    "country": "USA"
  }
]
```

### 5. Get Course Details with Tees and Holes
```http
GET /api/courses/1/
Authorization: Bearer <access_token>

Response 200:
{
  "id": 1,
  "name": "Pebble Beach Golf Links",
  "city": "Pebble Beach",
  "state": "California",
  "address": "1700 17 Mile Dr",
  "country": "USA",
  "tees": [
    {
      "id": 1,
      "name": "Championship",
      "slope": 145.0,
      "rating": 75.5,
      "par": 72,
      "holes": [...]
    },
    {
      "id": 2,
      "name": "Blue",
      "slope": 140.0,
      "rating": 73.5,
      "par": 72,
      "holes": [...]
    }
  ],
  "created_at": "2026-02-24T...",
  "updated_at": "2026-02-24T..."
}
```

### 6. Get Course Tees
```http
GET /api/courses/1/tees/
Authorization: Bearer <access_token>

Response 200:
[
  {
    "id": 1,
    "name": "Championship",
    "slope": 145.0,
    "rating": 75.5,
    "par": 72,
    "holes": [...]
  },
  ...
]
```

### 7. Get Course Holes for Specific Tee
```http
GET /api/courses/1/holes/?tee_id=1
Authorization: Bearer <access_token>

Response 200:
[
  {
    "id": 1,
    "hole_number": 1,
    "par": 4,
    "distance": 380,
    "created_at": "2026-02-24T...",
    "updated_at": "2026-02-24T..."
  },
  {
    "id": 2,
    "hole_number": 2,
    "par": 5,
    "distance": 502,
    "created_at": "2026-02-24T...",
    "updated_at": "2026-02-24T..."
  },
  ...
]
```

### 8. Update User Profile
```http
PUT /api/auth/me/profile/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "John Doe",
  "handicap_index": "12.5",
  "ghin_id": "1234567",
  "city": "San Francisco",
  "state": "California"
}

Response 200:
{
  "id": 1,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "username": "johndoe",
    ...
  },
  "display_name": "John Doe",
  "handicap_index": "12.5",
  "ghin_id": "1234567",
  "city": "San Francisco",
  "state": "California",
  ...
}
```

---

## Data Flow

### Course Search and Save Workflow
1. **User searches for course:**
   - Frontend calls `GET /api/search/?q=course name`
   - Backend calls Golf Course API
   - Returns external API results (not saved)

2. **User selects course to save:**
   - Frontend calls `POST /api/save/` with `course_id`
   - Backend fetches full course details from Golf Course API
   - Backend saves Course, CourseTees, and Holes to local database
   - Returns saved course data

3. **User views saved courses:**
   - Frontend calls `GET /api/courses/`
   - Backend returns courses from local database
   - No external API calls

### Profile Management Workflow
1. **User registers:**
   - Profile automatically created with handicap_index=20.0

2. **User updates profile:**
   - Frontend calls `PUT /api/auth/me/profile/`
   - Backend updates profile fields
   - Returns updated profile data

---

## Environment Variables

Add to `.env` file:
```
GOLF_COURSE_API_KEY=your-api-key-here
GOLF_COURSE_API_URL=https://api.golfcourseapi.com
```

**Note:** The Golf Course API key must be obtained from https://api.golfcourseapi.com

---

## Database Schema

### Course Data
- **Course** - Golf course information
- **CourseTee** - Tee box details (multiple per course)
- **Hole** - Individual hole data (18 per tee)

### Relationships
```
Course (1) ─── (Many) CourseTee
  │                │
  │                │
  └──── (Many) Hole ────┘
```

---

## Features Implemented

### Course Management
✅ Full CRUD operations for courses
✅ Search local courses by name, city, or state
✅ Get course details with nested tees and holes
✅ Read-only access to tees and holes
✅ Filter tees and holes by course/tee

### Golf Course API Integration
✅ Search external Golf Course API
✅ Fetch detailed course information
✅ Save courses to local database
✅ Automatic creation of tees and holes
✅ Update or create logic (idempotent)
✅ Error handling and logging

### Profile Management
✅ Auto-creation on registration
✅ Default handicap index (20.0)
✅ Optional GHIN ID
✅ Full profile CRUD
✅ Profile picture support
✅ All contact and address fields

---

## Security

### Authentication
- All course endpoints require JWT authentication
- Profile endpoints require JWT authentication
- API key for Golf Course API stored securely in environment variables

### Permissions
- Users can only access their own profile
- All authenticated users can search and view courses
- Course creation/update/delete restricted to authenticated users

---

## Testing the Integration

### Using cURL

**Search Golf Course API:**
```bash
curl -X GET "http://localhost:8000/api/search/?q=Augusta" \
  -H "Authorization: Bearer <access_token>"
```

**Save Course:**
```bash
curl -X POST http://localhost:8000/api/save/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"course_id": "12345"}'
```

**List Local Courses:**
```bash
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer <access_token>"
```

**Update Profile:**
```bash
curl -X PUT http://localhost:8000/api/auth/me/profile/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "John Doe",
    "handicap_index": "15.5"
  }'
```

---

## Files Created/Modified

### New Files
- `backend/apps/courses/serializers.py` - Course, Tee, Hole serializers
- `backend/apps/courses/services.py` - Golf Course API service
- `backend/apps/courses/urls.py` - Course API routing

### Modified Files
- `backend/apps/courses/views.py` - Course viewsets and API views
- `backend/config/urls.py` - Added course API routes

---

## Next Steps (Phase 6)

With courses and profiles in place, Phase 6 will focus on Round Tracking:
1. Round creation (total score and hole-by-hole)
2. Round score calculation
3. Hole score entry
4. Round history and retrieval
5. Score validation

---

## Phase 4 & 5 Status: ✅ COMPLETE

Profile management and course integration are fully functional. Users can manage their profiles, search for golf courses via the external API, save courses to the local database, and access course details including tees and holes.

**Estimated Time:** Phase 4 & 5 completed  
**Next Phase:** Phase 6 - Round Tracking (round creation, scoring, and history)
