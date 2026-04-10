# Deployment Guide Docker/Heroku Update Plan

This plan updates `docs/DEPLOYMENT_GUIDE.md` to add a primary backend deployment path using Heroku Container Registry with external managed Postgres, while preserving the existing VM-based path as an alternative.

## Scope
- Update documentation only: `docs/DEPLOYMENT_GUIDE.md`
- No code/runtime config changes in this step

## Planned Changes
1. Add a new top-level section: **Heroku Container Registry (Backend Only, Recommended)**.
2. Document required prerequisites for Heroku container deploy:
   - Heroku app (already provisioned)
   - Heroku CLI + Docker login
   - External managed Postgres URL
   - Netlify frontend URL(s)
3. Add backend container build/deploy workflow using repo structure:
   - Build backend image from `backend/Dockerfile`
   - Tag/push image to `registry.heroku.com/<app>/web`
   - Release image to Heroku web dyno
4. Add release/migrations strategy for container deployment:
   - Use Heroku release command pattern with `python manage.py migrate`
   - Clarify difference vs existing `backend/Procfile` path
5. Add required Heroku config vars checklist (container path):
   - `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `DATABASE_URL`
   - `GOLF_COURSE_API_KEY`, `GOLF_COURSE_API_URL`
   - `CORS_ALLOWED_ORIGINS` for Netlify domain(s)
   - secure defaults and examples
6. Add verification/runbook commands:
   - health/API checks
   - logs (`heroku logs --tail`)
   - rollback options (release rollback)
7. Add a concise section for Netlify integration:
   - set frontend API base URL to Heroku backend `/api`
   - required CORS alignment
8. Keep existing VM/Gunicorn/Nginx deployment content intact and clearly label it **Alternative: VM Deployment Path**.
9. Update “Alternative Deployment Options” to reference the new canonical Heroku container section instead of “separate Docker guide”.

## Acceptance Criteria
- Guide contains a clear, end-to-end backend-only Heroku Container Registry flow.
- Existing VM path remains available and unchanged in substance.
- Netlify frontend connection requirements are explicitly documented.
- Commands and env vars are consistent with current repo/Django settings and container setup.
