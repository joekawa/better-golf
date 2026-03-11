# Phase 6: Round Tracking - COMPLETED

## Overview
Phase 6 has successfully implemented a comprehensive round tracking system for the Better Golf application. Users can now create golf rounds with two scoring methods (Total Score and Hole-by-Hole), view their round history, retrieve detailed round information, and access basic statistics summaries.

## Completed Tasks

### 1. Round and Score Serializers ✅
**Location:** `apps/rounds/serializers.py`

**Serializers Created:**
- ✅ **ScoreTypeSerializer**
  - Fields: id, type, created_at
  - Used for score type representation
  
- ✅ **HoleScoreSerializer**
  - Fields: id, hole, hole_number, par, score, timestamps
  - Includes hole number and par from related Hole model
  - Used for displaying hole-by-hole scores
  
- ✅ **HoleScoreCreateSerializer**
  - Fields: hole, score
  - Lightweight serializer for creating hole scores
  
- ✅ **RoundScoreSerializer**
  - Fields: id, net_score, gross_score, timestamps
  - Represents overall round scoring
  
- ✅ **RoundListSerializer**
  - Lightweight serializer for round lists
  - Fields: id, course_name, date, score_type_display, gross_score, net_score, created_at
  - Optimized for list views
  
- ✅ **RoundSerializer**
  - Full round details with nested relationships
  - Fields: id, user_email, course, course_tee, score_type, date, score, hole_scores, timestamps
  - Includes all related data for complete round view
  
- ✅ **RoundCreateSerializer**
  - Handles round creation with validation
  - Supports both Total Score and Hole-by-Hole scoring
  - Fields: course, course_tee, score_type, date, gross_score, net_score, hole_scores
  - **Validation Logic:**
    - Total Score (type=0): Requires gross_score and net_score, no hole_scores
    - Hole-by-Hole (type=1): Requires exactly 18 hole_scores, no gross/net scores
  - **Auto-calculation:**
    - For Hole-by-Hole: Calculates gross_score from hole scores
    - Calculates net_score using user's handicap index and course slope
    - Formula: `net_score = gross_score - (handicap_index * slope / 113)`
  
- ✅ **RoundUpdateSerializer**
  - Fields: date
  - Allows updating round date only

### 2. Round ViewSets and Views ✅
**Location:** `apps/rounds/views.py`

**ViewSets:**
- ✅ **ScoreTypeViewSet** (Read-only)
  - List and retrieve score types
  - Returns: Total Score (0) and Hole-by-Hole (1)
  - Permission: IsAuthenticated
  
- ✅ **RoundViewSet** (Full CRUD)
  - Create, List, Retrieve, Update, Delete rounds
  - **Filtering:**
    - `?course_id=X` - Filter by course
    - `?date_from=YYYY-MM-DD` - Filter by start date
    - `?date_to=YYYY-MM-DD` - Filter by end date
    - `?score_type=0|1` - Filter by score type
  - **Custom Actions:**
    - `GET /api/rounds/{id}/hole_scores/` - Get round's hole scores
    - `GET /api/rounds/{id}/score/` - Get round's score
    - `GET /api/rounds/recent/?limit=10` - Get recent rounds
    - `GET /api/rounds/stats_summary/` - Get statistics summary
  - **Ordering:** By date (descending), then created_at (descending)
  - **User Isolation:** Users can only see their own rounds
  - Permission: IsAuthenticated
  
- ✅ **RoundScoreViewSet** (Read-only)
  - List and retrieve round scores
  - User-filtered automatically
  - Permission: IsAuthenticated
  
- ✅ **HoleScoreViewSet** (Read-only)
  - List and retrieve hole scores
  - Filter by round: `?round_id=X`
  - User-filtered automatically
  - Permission: IsAuthenticated

### 3. Score Type Population ✅
**Migration:** `apps/rounds/migrations/0002_populate_score_types.py`

**Score Types Created:**
- Type 0: Total Score
- Type 1: Hole-by-Hole

**Purpose:**
- Pre-populates ScoreType table with required types
- Ensures consistency across the application
- Reversible migration for rollback support

### 4. URL Configuration ✅
**File:** `apps/rounds/urls.py`

**Round API Endpoints:**
```
GET    /api/score-types/                - List score types
GET    /api/score-types/{id}/           - Get score type details

GET    /api/rounds/                     - List user's rounds
POST   /api/rounds/                     - Create new round
GET    /api/rounds/{id}/                - Get round details
PUT    /api/rounds/{id}/                - Update round
DELETE /api/rounds/{id}/                - Delete round
GET    /api/rounds/{id}/hole_scores/   - Get round's hole scores
GET    /api/rounds/{id}/score/          - Get round's score
GET    /api/rounds/recent/?limit=10     - Get recent rounds
GET    /api/rounds/stats_summary/       - Get statistics summary

GET    /api/round-scores/               - List round scores
GET    /api/round-scores/{id}/          - Get round score details

GET    /api/hole-scores/                - List hole scores
GET    /api/hole-scores/{id}/           - Get hole score details
GET    /api/hole-scores/?round_id=X     - Filter by round
```

**Main URLs Updated:**
- Added `path('api/', include('apps.rounds.urls'))` to `config/urls.py`

---

## API Usage Examples

### 1. Get Score Types
```http
GET /api/score-types/
Authorization: Bearer <access_token>

Response 200:
[
  {
    "id": 1,
    "type": 0,
    "created_at": "2026-02-24T..."
  },
  {
    "id": 2,
    "type": 1,
    "created_at": "2026-02-24T..."
  }
]
```

### 2. Create Round - Total Score Method
```http
POST /api/rounds/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "course": 1,
  "course_tee": 1,
  "score_type": 1,
  "date": "2026-02-24",
  "gross_score": 85,
  "net_score": 73
}

Response 201:
{
  "id": 1,
  "user_email": "user@example.com",
  "course": {
    "id": 1,
    "name": "Pebble Beach Golf Links",
    "city": "Pebble Beach",
    "state": "California",
    "country": "USA"
  },
  "course_tee": {
    "id": 1,
    "course_name": "Pebble Beach Golf Links",
    "name": "Championship",
    "slope": 145.0,
    "rating": 75.5,
    "par": 72
  },
  "score_type": {
    "id": 1,
    "type": 0,
    "created_at": "2026-02-24T..."
  },
  "date": "2026-02-24",
  "score": {
    "id": 1,
    "net_score": 73,
    "gross_score": 85,
    "created_at": "2026-02-24T...",
    "updated_at": "2026-02-24T..."
  },
  "hole_scores": [],
  "created_at": "2026-02-24T...",
  "updated_at": "2026-02-24T..."
}
```

### 3. Create Round - Hole-by-Hole Method
```http
POST /api/rounds/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "course": 1,
  "course_tee": 1,
  "score_type": 2,
  "date": "2026-02-24",
  "hole_scores": [
    {"hole": 1, "score": 4},
    {"hole": 2, "score": 5},
    {"hole": 3, "score": 3},
    {"hole": 4, "score": 4},
    {"hole": 5, "score": 5},
    {"hole": 6, "score": 4},
    {"hole": 7, "score": 3},
    {"hole": 8, "score": 4},
    {"hole": 9, "score": 5},
    {"hole": 10, "score": 4},
    {"hole": 11, "score": 4},
    {"hole": 12, "score": 3},
    {"hole": 13, "score": 5},
    {"hole": 14, "score": 4},
    {"hole": 15, "score": 4},
    {"hole": 16, "score": 3},
    {"hole": 17, "score": 4},
    {"hole": 18, "score": 5}
  ]
}

Response 201:
{
  "id": 2,
  "user_email": "user@example.com",
  "course": {...},
  "course_tee": {...},
  "score_type": {
    "id": 2,
    "type": 1,
    "created_at": "2026-02-24T..."
  },
  "date": "2026-02-24",
  "score": {
    "id": 2,
    "net_score": 61,
    "gross_score": 73,
    "created_at": "2026-02-24T...",
    "updated_at": "2026-02-24T..."
  },
  "hole_scores": [
    {
      "id": 1,
      "hole": 1,
      "hole_number": 1,
      "par": 4,
      "score": 4,
      "created_at": "2026-02-24T...",
      "updated_at": "2026-02-24T..."
    },
    ...
  ],
  "created_at": "2026-02-24T...",
  "updated_at": "2026-02-24T..."
}
```

### 4. List User's Rounds
```http
GET /api/rounds/
Authorization: Bearer <access_token>

Response 200:
[
  {
    "id": 2,
    "course_name": "Pebble Beach Golf Links",
    "date": "2026-02-24",
    "score_type_display": "Hole-by-Hole",
    "gross_score": 73,
    "net_score": 61,
    "created_at": "2026-02-24T..."
  },
  {
    "id": 1,
    "course_name": "Pebble Beach Golf Links",
    "date": "2026-02-24",
    "score_type_display": "Total Score",
    "gross_score": 85,
    "net_score": 73,
    "created_at": "2026-02-24T..."
  }
]
```

### 5. Filter Rounds by Course
```http
GET /api/rounds/?course_id=1
Authorization: Bearer <access_token>

Response 200:
[
  {...rounds for course 1...}
]
```

### 6. Filter Rounds by Date Range
```http
GET /api/rounds/?date_from=2026-02-01&date_to=2026-02-28
Authorization: Bearer <access_token>

Response 200:
[
  {...rounds in February 2026...}
]
```

### 7. Get Round Details
```http
GET /api/rounds/2/
Authorization: Bearer <access_token>

Response 200:
{
  "id": 2,
  "user_email": "user@example.com",
  "course": {
    "id": 1,
    "name": "Pebble Beach Golf Links",
    "city": "Pebble Beach",
    "state": "California",
    "country": "USA"
  },
  "course_tee": {
    "id": 1,
    "course_name": "Pebble Beach Golf Links",
    "name": "Championship",
    "slope": 145.0,
    "rating": 75.5,
    "par": 72
  },
  "score_type": {
    "id": 2,
    "type": 1,
    "created_at": "2026-02-24T..."
  },
  "date": "2026-02-24",
  "score": {
    "id": 2,
    "net_score": 61,
    "gross_score": 73,
    "created_at": "2026-02-24T...",
    "updated_at": "2026-02-24T..."
  },
  "hole_scores": [
    {
      "id": 1,
      "hole": 1,
      "hole_number": 1,
      "par": 4,
      "score": 4,
      "created_at": "2026-02-24T...",
      "updated_at": "2026-02-24T..."
    },
    ...18 holes total...
  ],
  "created_at": "2026-02-24T...",
  "updated_at": "2026-02-24T..."
}
```

### 8. Get Round's Hole Scores
```http
GET /api/rounds/2/hole_scores/
Authorization: Bearer <access_token>

Response 200:
[
  {
    "id": 1,
    "hole": 1,
    "hole_number": 1,
    "par": 4,
    "score": 4,
    "created_at": "2026-02-24T...",
    "updated_at": "2026-02-24T..."
  },
  {
    "id": 2,
    "hole": 2,
    "hole_number": 2,
    "par": 5,
    "score": 5,
    "created_at": "2026-02-24T...",
    "updated_at": "2026-02-24T..."
  },
  ...
]
```

### 9. Get Recent Rounds
```http
GET /api/rounds/recent/?limit=5
Authorization: Bearer <access_token>

Response 200:
[
  {...5 most recent rounds...}
]
```

### 10. Get Statistics Summary
```http
GET /api/rounds/stats_summary/
Authorization: Bearer <access_token>

Response 200:
{
  "total_rounds": 15,
  "average_score": 82.3,
  "best_score": 73,
  "worst_score": 95
}
```

### 11. Update Round Date
```http
PUT /api/rounds/1/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "date": "2026-02-25"
}

Response 200:
{
  "date": "2026-02-25"
}
```

### 12. Delete Round
```http
DELETE /api/rounds/1/
Authorization: Bearer <access_token>

Response 204 No Content
```

---

## Scoring Logic

### Total Score Method (Type 0)
- User manually enters gross_score and net_score
- No hole-by-hole data required
- Quick entry for casual rounds
- RoundScore created directly with provided values

### Hole-by-Hole Method (Type 1)
- User enters score for each of 18 holes
- System validates exactly 18 hole scores
- **Gross Score Calculation:**
  ```
  gross_score = sum of all 18 hole scores
  ```
- **Net Score Calculation:**
  ```
  course_handicap = (user_handicap_index * course_slope) / 113
  net_score = gross_score - course_handicap
  ```
- Creates HoleScore records for each hole
- Creates RoundScore with calculated values

### Handicap Calculation
- Uses user's `handicap_index` from Profile (default 20.0)
- Uses course tee's `slope` rating
- Standard USGA formula: `(handicap_index * slope) / 113`
- Rounded to nearest integer for net score

---

## Data Flow

### Round Creation Workflow
1. **User initiates round creation:**
   - Selects course and tee
   - Chooses score type (Total or Hole-by-Hole)
   - Enters date

2. **For Total Score:**
   - User enters gross_score and net_score
   - Frontend calls `POST /api/rounds/`
   - Backend creates Round and RoundScore

3. **For Hole-by-Hole:**
   - User enters score for each hole
   - Frontend calls `POST /api/rounds/` with 18 hole_scores
   - Backend validates 18 holes
   - Backend creates Round
   - Backend creates 18 HoleScore records
   - Backend calculates gross_score (sum of holes)
   - Backend calculates net_score (using handicap)
   - Backend creates RoundScore

4. **Round retrieval:**
   - Frontend calls `GET /api/rounds/`
   - Backend returns user's rounds with scores
   - Frontend displays round history

---

## Validation Rules

### Round Creation
- ✅ course, course_tee, score_type, date are required
- ✅ score_type must be valid ScoreType instance
- ✅ For Total Score (type=0):
  - gross_score and net_score required
  - hole_scores must be empty
- ✅ For Hole-by-Hole (type=1):
  - hole_scores required
  - Exactly 18 hole scores required
  - gross_score and net_score not allowed (auto-calculated)

### Hole Scores
- ✅ Each hole score must reference valid Hole
- ✅ Score must be integer
- ✅ Hole must belong to selected course and tee

### User Isolation
- ✅ Users can only view their own rounds
- ✅ Users can only create rounds for themselves
- ✅ Users can only update/delete their own rounds

---

## Database Schema

### Round Tracking Tables
- **ScoreType** - Score type definitions (Total, Hole-by-Hole)
- **Round** - Golf round records
- **RoundScore** - Overall round scores (gross, net)
- **HoleScore** - Individual hole scores

### Relationships
```
User (1) ────── (Many) Round
Course (1) ───── (Many) Round
CourseTee (1) ── (Many) Round
ScoreType (1) ── (Many) Round

Round (1) ────── (1) RoundScore
Round (1) ────── (Many) HoleScore
Hole (1) ─────── (Many) HoleScore
```

---

## Features Implemented

### Round Management
✅ Create rounds with Total Score method
✅ Create rounds with Hole-by-Hole method
✅ View round history (list and detail)
✅ Update round date
✅ Delete rounds
✅ Filter rounds by course, date range, score type
✅ Get recent rounds with limit

### Scoring
✅ Manual gross/net score entry (Total)
✅ Hole-by-hole score entry
✅ Automatic gross score calculation (Hole-by-Hole)
✅ Automatic net score calculation using handicap
✅ Course handicap calculation (USGA formula)
✅ Score validation

### Statistics
✅ Total rounds count
✅ Average score calculation
✅ Best score tracking
✅ Worst score tracking
✅ User-specific statistics

### Data Access
✅ User isolation (users see only their rounds)
✅ Efficient queries with select_related/prefetch_related
✅ Ordering by date (most recent first)
✅ Read-only access to scores and hole scores

---

## Security

### Authentication
- All round endpoints require JWT authentication
- Users automatically associated with their rounds

### Authorization
- Users can only access their own rounds
- No cross-user data access
- Round creation automatically assigns to authenticated user

### Data Integrity
- Validation ensures data consistency
- Foreign key constraints prevent orphaned records
- Score type validation prevents invalid configurations

---

## Testing the Round Tracking System

### Using cURL

**Create Total Score Round:**
```bash
curl -X POST http://localhost:8000/api/rounds/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "course": 1,
    "course_tee": 1,
    "score_type": 1,
    "date": "2026-02-24",
    "gross_score": 85,
    "net_score": 73
  }'
```

**List Rounds:**
```bash
curl -X GET http://localhost:8000/api/rounds/ \
  -H "Authorization: Bearer <access_token>"
```

**Get Statistics:**
```bash
curl -X GET http://localhost:8000/api/rounds/stats_summary/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Files Created/Modified

### New Files
- `backend/apps/rounds/serializers.py` - Round, Score, HoleScore serializers
- `backend/apps/rounds/urls.py` - Round API routing
- `backend/apps/rounds/migrations/0002_populate_score_types.py` - ScoreType population

### Modified Files
- `backend/apps/rounds/views.py` - Round viewsets and endpoints
- `backend/config/urls.py` - Added round API routes

---

## Next Steps (Phase 7)

Phase 7 will focus on the Statistics Engine:
1. Detailed statistics calculation (fairways hit, GIR, putts, etc.)
2. Statistics tracking per round
3. Historical statistics aggregation
4. Performance trends and analysis
5. Statistics API endpoints

---

## Phase 6 Status: ✅ COMPLETE

The round tracking system is fully functional with support for both Total Score and Hole-by-Hole scoring methods. Users can create rounds, view their history, filter by various criteria, and access basic statistics. The system automatically calculates net scores using handicap indexes and course slope ratings.

**Estimated Time:** Phase 6 completed  
**Next Phase:** Phase 7 - Statistics Engine (detailed golf statistics tracking and analysis)
