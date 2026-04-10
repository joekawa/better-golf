# Deployment Guide Heroku Container Update (2026-04-10)

Updated deployment documentation to formalize Heroku Container Registry as the recommended backend deployment path, with external managed PostgreSQL and Netlify frontend integration.

## Changes made
- Updated `docs/DEPLOYMENT_GUIDE.md`:
  - Added `Backend Deployment (Heroku Container Registry - Recommended)` section with:
    - prerequisites
    - Heroku container login/stack setup
    - required config vars
    - backend container build/push/release commands
    - migration runbook for container deployments
    - verification and rollback commands
    - Netlify integration notes (`VITE_API_URL`, CORS alignment)
  - Relabeled legacy backend section to:
    - `Alternative: VM Deployment Path (Django)`
  - Updated `Alternative Deployment Options` container subsection to reference the canonical Heroku container workflow in the same guide.

- Added plan artifact copy:
  - `docs/DEPLOYMENT_GUIDE_DOCKER.md`

## Outcome
The deployment guide now clearly supports the selected production direction: backend-only Docker deployment on Heroku Container Registry with external managed Postgres, while retaining VM instructions as an alternative path.
