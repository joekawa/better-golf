# Mobile Simulator DisallowedHost Fix (2026-04-09)

## Issue
Mobile simulator login requests returned `400` with HTML error body, while web login worked.

## Root cause
Django rejected simulator/device host header:

- `Invalid HTTP_HOST header: '192.168.1.84'`
- `django.core.exceptions.DisallowedHost`

This happened because backend `ALLOWED_HOSTS` only allowed localhost values.

## Fix
Updated development compose backend env in `docker-compose.dev.yml`:

- `ALLOWED_HOSTS: "*"`

This is scoped to development compose config and allows LAN simulator/device hostnames/IPs.

## Verification
- Restarted backend/proxy services.
- Re-tested login with `Host: 192.168.1.84` header via proxy.
- `POST /api/auth/login/` now returns `200` and JSON tokens.
