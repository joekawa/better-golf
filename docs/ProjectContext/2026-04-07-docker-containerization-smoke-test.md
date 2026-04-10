# Docker Containerization Smoke Test (2026-04-07)

Implemented Docker containerization artifacts for backend and frontend with an Nginx reverse proxy, including dev/prod compose profiles.

## Added files
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `proxy/nginx.conf`

## Smoke test run
- Command: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`
- Initial issue: `502` from proxy due stale upstream container IPs after container recreation.
- Fix used: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate proxy`

## Final endpoint checks
- `GET http://localhost/` -> `200`
- `GET http://localhost/api/` -> `401` (expected unauthenticated API response)
- `GET http://localhost/admin/` -> `302` (expected redirect to admin login)

## Notes
- Removed host port mapping for dev Postgres (`5432:5432`) to avoid collision with local Postgres instances.
- Stack is currently up and running for further manual testing.
