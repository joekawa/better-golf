# Deployment Guide Editorial Pass (2026-04-10)

Performed a final editorial cleanup on deployment docs after adding the Heroku container deployment path.

## Updated file
- `docs/DEPLOYMENT_GUIDE.md`

## Editorial updates
- Added an explicit recommended production path in Overview:
  - backend on Heroku Container Registry
  - frontend on Netlify
  - external managed PostgreSQL
- Clarified prerequisite applicability:
  - Ubuntu server and local Python/Node are primarily for VM path
  - external managed Postgres is recommended
- Removed contradictory Heroku wording in alternative options:
  - replaced "git push" phrasing with reference to Heroku Container Registry workflow already documented above

## Outcome
The guide is now more consistent and avoids mixed messaging between classic Heroku buildpack deployment and container registry deployment.
