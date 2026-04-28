# Backend Deployment Script — Heroku Container Registry (2026-04-23)

Created an automated deployment script for the Django backend using the Heroku Container Registry workflow documented in `docs/DEPLOYMENT_GUIDE.md`.

## Files Created / Modified

| File | Action |
|------|--------|
| `scripts/deploy-backend.sh` | Created — main deployment script (executable) |
| `backend/.env.production.example` | Created — production env var template (committed to git) |
| `backend/.gitignore` | Modified — added `.env.production` to prevent secret commits |

---

## Usage

Run from the **repository root**:

```bash
# First deploy — pushes env vars, builds, releases, migrates
./scripts/deploy-backend.sh <HEROKU_APP_NAME>

# Re-deploy (code changes only, env vars already set on Heroku)
./scripts/deploy-backend.sh <HEROKU_APP_NAME> --skip-env

# Re-deploy skipping env vars and migrations (e.g. rollback scenario)
./scripts/deploy-backend.sh <HEROKU_APP_NAME> --skip-env --skip-migrate
```

---

## Automated Steps

### Step 1 — Preflight Checks
- Verifies `backend/` directory exists (must run from repo root)
- Checks Heroku CLI is installed
- Checks Docker is installed and the daemon is running
- Validates Heroku authentication (`heroku auth:whoami`)
- Confirms the target Heroku app exists and is accessible
- Confirms `backend/.env.production` exists (unless `--skip-env`)

### Step 2 — Heroku Container Registry Login & Stack
```bash
heroku stack:set container -a <HEROKU_APP_NAME>
heroku container:login
```

### Step 3 — Push Environment Variables to Heroku
- Reads `backend/.env.production`
- Validates all required keys are present and non-empty:
  - `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`
  - `GOLF_COURSE_API_KEY`, `GOLF_COURSE_API_URL`
  - `CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_ALL_ORIGINS`
- Pushes all vars in a single `heroku config:set` call
- Skipped with `--skip-env`

### Step 4 — Build Docker Image
```bash
docker build -t registry.heroku.com/<HEROKU_APP_NAME>/web ./backend
```
Uses the existing `backend/Dockerfile` (Python 3.13-slim, gunicorn).

### Step 5 — Push Image to Heroku Container Registry
```bash
docker push registry.heroku.com/<HEROKU_APP_NAME>/web
```

### Step 6 — Release Container
```bash
heroku container:release web -a <HEROKU_APP_NAME>
```

### Step 7 — Run Database Migrations
```bash
heroku run python manage.py migrate -a <HEROKU_APP_NAME>
```
Skipped with `--skip-migrate`. Note: the `Procfile` release phase is not used in the container registry workflow — migrations are run explicitly here per the deployment guide.

### Post-Deploy Verification
- `heroku ps -a <HEROKU_APP_NAME>` — checks dyno status
- `curl` smoke test against `https://<HEROKU_APP_NAME>.herokuapp.com/api/` — accepts HTTP 200, 301, 302, or 404 as passing

---

## Production Environment Variables

Copy `backend/.env.production.example` to `backend/.env.production` and fill in all values before running the script. The `.env.production` file is gitignored.

Required variables:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key (50+ character random string) |
| `DEBUG` | Must be `False` |
| `ALLOWED_HOSTS` | Comma-separated hostnames (Heroku domain + any custom domain) |
| `DATABASE_URL` | External managed PostgreSQL connection URL |
| `GOLF_COURSE_API_KEY` | Golf Course API key |
| `GOLF_COURSE_API_URL` | `https://api.golfcourseapi.com` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins (Netlify URL + custom domain) |
| `CORS_ALLOW_ALL_ORIGINS` | Must be `False` |

---

## Design Decisions
- **`.env.production` → Heroku config** pattern chosen for repeatable deploys without re-typing values interactively.
- `--skip-env` flag enables fast re-deploys when only application code has changed.
- `--skip-migrate` flag supports rollback scenarios where running migrations would be destructive.
- Env var validation (non-empty check + required key check) prevents partial configs from reaching Heroku.
- Smoke test accepts 404 as a passing status — the `/api/` root returning 404 is valid if no index view is registered.
