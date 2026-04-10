# Mobile Auth Connectivity Fix (2026-04-08)

## Context
Mobile login/registration failed while web login worked.

## Root cause
`mobile/lib/api.ts` used `http://localhost:8000/api` as the default base URL. In the current Docker setup, backend traffic should go through the proxy (`http://<host>/api`), and `:8000` is not exposed on host.

This caused mobile auth requests to fail depending on runtime (device/emulator), even though web requests succeeded through Nginx.

## Changes made
- Updated `mobile/lib/api.ts` to resolve API base URL safely for Expo/mobile runtimes:
  - Use `EXPO_PUBLIC_API_URL` when provided.
  - Otherwise use Expo host discovery and default to `http://<expo-host>/api`.
  - Android emulator fallback: `http://10.0.2.2/api`.
  - Final fallback: `http://localhost/api`.
- Added API diagnostics logging:
  - Logs selected API base URL at startup.
  - Logs network failures with request URL and message.
  - Logs refresh token failures.
- Updated auth screens:
  - `mobile/app/(auth)/login.tsx`
  - `mobile/app/(auth)/register.tsx`
  - Both now show explicit connectivity message for network failures and log useful diagnostics including `API_BASE_URL`.

## Validation
- Verified backend + proxy are up and healthy.
- Probed auth endpoint through proxy:
  - `POST /api/auth/login/` returned `200`.
- Confirmed backend logs captured successful auth requests.

## Follow-up guidance
- Restart Expo with cache clear after this change:
  - `npx expo start -c`
- If using a physical device, set `EXPO_PUBLIC_API_URL` to your machine LAN IP, e.g.:
  - `EXPO_PUBLIC_API_URL=http://192.168.x.x/api`
