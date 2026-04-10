# Docker Frontend Rollup Fix (2026-04-08)

Resolved web `502` errors in Docker dev stack caused by frontend container startup failure on Rollup optional native dependency.

## Root cause
- Frontend container failed with:
  - `Cannot find module @rollup/rollup-linux-arm64-gnu`
- With frontend down, Nginx proxy returned `502` for `/` and `/login`.

## Changes made
- Updated `frontend/Dockerfile` to Debian Node base (`node:20-bookworm-slim`) and explicitly install Rollup native package:
  - `npm i --no-save @rollup/rollup-linux-arm64-gnu`
- Updated `docker-compose.dev.yml` frontend service command to ensure runtime `/app/node_modules` volume is populated before Vite starts:
  - `npm ci && npm i --no-save @rollup/rollup-linux-arm64-gnu && npm run dev -- --host 0.0.0.0 --port 5173`
- Confirmed `VITE_API_URL` in dev compose points to proxy path:
  - `http://localhost/api`

## Verification
- Endpoint checks after warm-up:
  - `GET http://localhost/` -> `200`
  - `GET http://localhost/login` -> `200`
  - `GET http://localhost/api/` -> `401` (expected unauthenticated)

## Note
- Brief `502` responses may occur during container warm-up while frontend installs dependencies; they clear once Vite is ready.
