# 9/18-Hole Round Support — Implementation Complete

## Date
2025

## What Was Implemented

### Backend

#### `CourseTee` model (`apps/courses/models.py`)
- Added `front_course_rating`, `back_course_rating` (DecimalField, nullable)
- Added `front_slope_rating`, `back_slope_rating` (IntegerField, nullable)
- Migration: `courses/migrations/0003_add_nine_hole_support.py`

#### `Round` model (`apps/rounds/models.py`)
- Added `holes_played` (IntegerField, default=18)
- Added `hole_segment` (CharField, choices: `full_18` | `front_9` | `back_9`, default=`full_18`)
- Added `expected_hole_numbers` and `expected_hole_count` properties
- Migration: `rounds/migrations/0004_add_nine_hole_support.py`

#### Course API import (`apps/courses/services.py`)
- `save_course_to_db` now maps `front_course_rating`, `back_course_rating`, `front_slope_rating`, `back_slope_rating` from Golf Course API tee data

#### Course serializers (`apps/courses/serializers.py`)
- `CourseTeeSerializer` and `CourseTeeListSerializer` expose all four side-specific fields

#### Round serializers (`apps/rounds/serializers.py`)
- `RoundCreateSerializer`: accepts `holes_played` + `hole_segment`; validates count/segment consistency; validates hole count matches `holes_played` for HBH; net score calculation uses side-specific rating/slope
- `RoundListSerializer` + `RoundSerializer`: expose `holes_played` and `hole_segment`
- `_calculate_net_score()` helper: uses front/back rating+slope for 9-hole rounds, falls back to half full rating if side data missing

#### Handicap service (`apps/users/services.py`)
- `calculate_score_differential()`: uses `front_course_rating`/`back_course_rating` and slope for 9-hole differentials; falls back to `rating/2` if side fields are null; logs warning when fallback is used

#### Stats serializer (`apps/stats/serializers.py`)
- All hardcoded `18` limits replaced with `round_instance.holes_played` where a round instance is available

### Tests
- `apps/rounds/tests/test_nine_hole.py` — 12 tests covering:
  - `Round` model defaults and `expected_hole_numbers` property
  - Handicap differential: full 18, front 9, back 9 (with and without side ratings)
  - `CourseTee` side field storage and nullability

### Web UI (`frontend/src/components/rounds/AddRound.tsx`)
- Step 3 (Round Details) now shows a 3-button segment selector: **18 Holes / Front 9 / Back 9**
- `holeSegment` state drives `getFilteredHoles()` which filters the holes array
- HBH score entry renders only the holes for the selected segment
- `calculateNetScore()` uses side-specific rating/slope for 9-hole rounds
- API payload includes `holes_played` and `hole_segment`
- Confirmation modal shows segment label

### Mobile (`mobile/app/rounds/add.tsx`)
- Step 3 adds segment selector (same three options)
- `selectTee` no longer pre-initializes `holeScores`; initialization moved to `selectScoreType` so it uses the correct filtered holes
- `calculateNetScore()` mirrors web logic (side-specific for 9-hole)
- API payload includes `holes_played` and `hole_segment`
- HBH hole entry shows correct hole number and count for selected segment
- Total score label for fairways/GIR shows correct max (7/9 for 9-hole)

## Backward Compatibility
- All existing 18-hole rounds default to `holes_played=18`, `hole_segment=full_18` — no data migration needed
- Side rating fields are nullable, so existing tee records without Golf Course API data continue to work via fallback
