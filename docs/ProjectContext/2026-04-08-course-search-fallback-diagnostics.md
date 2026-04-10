# Course Search Fallback Diagnostics Update (2026-04-08)

Implemented API-first course search diagnostics and mobile fallback visibility to make cache fallback reasons explicit when external course API calls fail.

## Backend changes
- Updated `backend/apps/courses/services.py`:
  - Added structured fallback metadata from `search_courses()`:
    - `fallback_reason`
    - `api_status_code`
    - `message`
  - Classified API failures into:
    - `api_unauthorized` (401/403)
    - `api_timeout`
    - `api_unreachable`
    - `api_error`
  - Added sanitized one-time runtime config logging in `GolfCourseAPIService` init (`api_key_present`, masked key hint, base URL).
- Updated `backend/apps/courses/views.py` `CourseSearchAPIView` response to include fallback metadata while keeping existing fields (`source`, `count`, `results`).

## Mobile changes
- Updated `mobile/app/rounds/add.tsx` course search flow to:
  - Log source and fallback metadata in console.
  - Show user-facing alert when search falls back to cache due to API auth failure.
  - Show generic fallback notice for other fallback reasons.

## Test updates
- Updated `backend/apps/courses/tests/test_api.py` to align with current endpoint/query conventions and response shape.
- Added/updated search endpoint tests for:
  - API success
  - unauthorized fallback
  - timeout fallback

## Validation
- Ran targeted tests:
  - `python manage.py test apps.courses.tests.test_api.CourseSearchAPITest`
  - Result: **4 tests passed**.

## Operational note
- If `fallback_reason=api_unauthorized` continues after backend restart, the external Golf Course API key is still invalid/expired in runtime and should be rotated with the provider.
