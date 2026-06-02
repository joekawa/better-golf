# Security Checklist Review — 2026-06-01

Reviewed `docs/DEPLOYMENT_GUIDE.md` security checklist against current repository configuration.

## Key Findings

- Django production security settings are partially configured in `backend/config/settings.py` under `if not DEBUG`.
- CORS settings exist but default to permissive `CORS_ALLOW_ALL_ORIGINS=True` unless overridden in production environment variables.
- CSRF middleware is enabled, but `CSRF_TRUSTED_ORIGINS` is not configured in settings.
- No app-level rate limiting or DRF throttling was found.
- `.gitignore` is minimal and does not currently ignore `.env`, `.env.*`, or `venv/` globally.
- Tracked env-like files include `backend/.env.bak` and `frontend/.env.production`; these should be reviewed for secrets.

## High Priority Follow-ups

1. Remove secrets from tracked env files if present and rotate any exposed credentials.
2. Expand `.gitignore` to ignore `.env`, `.env.*`, local DB files, Python caches, Node artifacts, and virtualenvs while explicitly allowing safe example files.
3. Add/verify production-only settings for `SECURE_PROXY_SSL_HEADER`, HSTS, CSRF trusted origins, and strict CORS.
4. Add DRF throttling or route-specific rate limiting for auth and public endpoints.
