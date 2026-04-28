#!/usr/bin/env bash
# =============================================================================
# Better Golf — Backend Deployment Script (Heroku Container Registry)
# =============================================================================
# Usage:
#   ./scripts/deploy-backend.sh <HEROKU_APP_NAME> [--skip-env] [--skip-migrate]
#
# Options:
#   --skip-env      Skip pushing env vars from backend/.env.production to Heroku
#   --skip-migrate  Skip running database migrations after release
#
# Prerequisites:
#   - Heroku CLI installed and authenticated (heroku login)
#   - Docker installed and running
#   - backend/.env.production exists (copy from backend/.env.production.example)
#
# Run from the repository root:
#   ./scripts/deploy-backend.sh my-heroku-app-name
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Color helpers
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${BLUE}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
step()    { echo -e "\n${BOLD}==>${RESET} $*"; }

# -----------------------------------------------------------------------------
# Argument parsing
# -----------------------------------------------------------------------------
HEROKU_APP_NAME=""
SKIP_ENV=false
SKIP_MIGRATE=false

for arg in "$@"; do
  case "$arg" in
    --skip-env)     SKIP_ENV=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    --*)
      error "Unknown option: $arg"
      echo "Usage: $0 <HEROKU_APP_NAME> [--skip-env] [--skip-migrate]"
      exit 1
      ;;
    *)
      if [[ -z "$HEROKU_APP_NAME" ]]; then
        HEROKU_APP_NAME="$arg"
      else
        error "Unexpected argument: $arg"
        echo "Usage: $0 <HEROKU_APP_NAME> [--skip-env] [--skip-migrate]"
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$HEROKU_APP_NAME" ]]; then
  error "HEROKU_APP_NAME is required."
  echo "Usage: $0 <HEROKU_APP_NAME> [--skip-env] [--skip-migrate]"
  exit 1
fi

# -----------------------------------------------------------------------------
# Paths (script must be run from repo root)
# -----------------------------------------------------------------------------
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
ENV_PRODUCTION="$BACKEND_DIR/.env.production"
IMAGE_TAG="registry.heroku.com/${HEROKU_APP_NAME}/web"

info "Repository root : $REPO_ROOT"
info "Heroku app name : $HEROKU_APP_NAME"
info "Docker image    : $IMAGE_TAG"
[[ "$SKIP_ENV"     == "true" ]] && warn "  --skip-env flag set: Heroku config vars will NOT be updated"
[[ "$SKIP_MIGRATE" == "true" ]] && warn "  --skip-migrate flag set: migrations will NOT be run"

# -----------------------------------------------------------------------------
# Step 1 — Preflight checks
# -----------------------------------------------------------------------------
step "Step 1/7  Preflight checks"

if [[ ! -d "$BACKEND_DIR" ]]; then
  error "backend/ directory not found at $BACKEND_DIR"
  error "Make sure you are running this script from the repository root."
  exit 1
fi
success "backend/ directory found"

if ! command -v heroku &>/dev/null; then
  error "Heroku CLI not found. Install it from https://devcenter.heroku.com/articles/heroku-cli"
  exit 1
fi
success "Heroku CLI found: $(heroku --version | head -1)"

if ! command -v docker &>/dev/null; then
  error "Docker not found. Install it from https://docs.docker.com/get-docker/"
  exit 1
fi
success "Docker found: $(docker --version)"

if ! docker info &>/dev/null; then
  error "Docker daemon is not running. Start Docker and try again."
  exit 1
fi
success "Docker daemon is running"

if ! heroku auth:whoami &>/dev/null; then
  error "Not authenticated with Heroku. Run: heroku login"
  exit 1
fi
HEROKU_USER="$(heroku auth:whoami)"
success "Heroku authenticated as: $HEROKU_USER"

if ! heroku apps:info -a "$HEROKU_APP_NAME" &>/dev/null; then
  error "Heroku app '$HEROKU_APP_NAME' not found or not accessible."
  error "Verify the app name and that your account has access."
  exit 1
fi
success "Heroku app '$HEROKU_APP_NAME' is accessible"

if [[ "$SKIP_ENV" == "false" ]]; then
  if [[ ! -f "$ENV_PRODUCTION" ]]; then
    error "backend/.env.production not found at $ENV_PRODUCTION"
    error "Copy backend/.env.production.example to backend/.env.production and fill in values."
    exit 1
  fi
  success "backend/.env.production found"
fi

# -----------------------------------------------------------------------------
# Step 2 — Login to Heroku Container Registry and set stack
# -----------------------------------------------------------------------------
step "Step 2/7  Heroku Container Registry login & stack configuration"

info "Setting Heroku stack to 'container' for app '$HEROKU_APP_NAME'..."
heroku stack:set container -a "$HEROKU_APP_NAME"
success "Stack set to container"

info "Logging in to Heroku Container Registry..."
heroku container:login
success "Logged in to registry.heroku.com"

# -----------------------------------------------------------------------------
# Step 3 — Push environment variables from .env.production to Heroku
# -----------------------------------------------------------------------------
if [[ "$SKIP_ENV" == "false" ]]; then
  step "Step 3/7  Pushing environment variables to Heroku config"

  # Validate required keys are present and non-empty in .env.production
  REQUIRED_KEYS=(
    "SECRET_KEY"
    "DEBUG"
    "ALLOWED_HOSTS"
    "DATABASE_URL"
    "GOLF_COURSE_API_KEY"
    "GOLF_COURSE_API_URL"
    "CORS_ALLOWED_ORIGINS"
    "CORS_ALLOW_ALL_ORIGINS"
  )

  missing=()
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and blank lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    if [[ -z "$value" ]]; then
      missing+=("$key")
    fi
  done < "$ENV_PRODUCTION"

  # Also check that all required keys exist
  for req_key in "${REQUIRED_KEYS[@]}"; do
    if ! grep -q "^${req_key}=" "$ENV_PRODUCTION"; then
      missing+=("$req_key (missing from file)")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    error "The following required env vars are empty or missing in backend/.env.production:"
    for m in "${missing[@]}"; do
      error "  - $m"
    done
    exit 1
  fi

  # Build heroku config:set arguments from .env.production
  CONFIG_ARGS=()
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    CONFIG_ARGS+=("$line")
  done < "$ENV_PRODUCTION"

  info "Setting ${#CONFIG_ARGS[@]} config vars on Heroku..."
  heroku config:set "${CONFIG_ARGS[@]}" -a "$HEROKU_APP_NAME"
  success "Heroku config vars updated"
else
  step "Step 3/7  Skipping environment variable push (--skip-env)"
fi

# -----------------------------------------------------------------------------
# Step 4 — Build Docker image
# -----------------------------------------------------------------------------
step "Step 4/7  Building Docker image"

info "Building image: $IMAGE_TAG"
docker build -t "$IMAGE_TAG" "$BACKEND_DIR"
success "Docker image built successfully"

# -----------------------------------------------------------------------------
# Step 5 — Push image to Heroku Container Registry
# -----------------------------------------------------------------------------
step "Step 5/7  Pushing image to Heroku Container Registry"

info "Pushing $IMAGE_TAG ..."
docker push "$IMAGE_TAG"
success "Image pushed to registry.heroku.com"

# -----------------------------------------------------------------------------
# Step 6 — Release container
# -----------------------------------------------------------------------------
step "Step 6/7  Releasing container on Heroku"

heroku container:release web -a "$HEROKU_APP_NAME"
success "Container released"

# -----------------------------------------------------------------------------
# Step 7 — Run database migrations
# -----------------------------------------------------------------------------
if [[ "$SKIP_MIGRATE" == "false" ]]; then
  step "Step 7/7  Running database migrations"

  info "Running: heroku run python manage.py migrate -a $HEROKU_APP_NAME"
  heroku run python manage.py migrate -a "$HEROKU_APP_NAME"
  success "Migrations applied"
else
  step "Step 7/7  Skipping migrations (--skip-migrate)"
fi

# -----------------------------------------------------------------------------
# Post-deploy: Verify and smoke test
# -----------------------------------------------------------------------------
step "Post-deploy verification"

info "Checking dyno status..."
heroku ps -a "$HEROKU_APP_NAME"

APP_URL="https://${HEROKU_APP_NAME}.herokuapp.com"
info "Running smoke test against ${APP_URL}/api/ ..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${APP_URL}/api/" || echo "000")

if [[ "$HTTP_STATUS" =~ ^(200|301|302|404)$ ]]; then
  success "Smoke test passed — HTTP $HTTP_STATUS from ${APP_URL}/api/"
elif [[ "$HTTP_STATUS" == "000" ]]; then
  warn "Smoke test: could not reach ${APP_URL}/api/ (curl timeout or network error)"
  warn "The app may still be starting up. Check logs: heroku logs --tail -a $HEROKU_APP_NAME"
else
  warn "Smoke test returned HTTP $HTTP_STATUS from ${APP_URL}/api/"
  warn "Check logs: heroku logs --tail -a $HEROKU_APP_NAME"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${GREEN}Deployment complete!${RESET}"
echo -e "  App URL  : ${APP_URL}"
echo -e "  API URL  : ${APP_URL}/api/"
echo -e "  Admin    : ${APP_URL}/admin/"
echo ""
echo -e "Useful commands:"
echo -e "  heroku logs --tail -a $HEROKU_APP_NAME"
echo -e "  heroku ps -a $HEROKU_APP_NAME"
echo -e "  heroku releases -a $HEROKU_APP_NAME"
echo -e "  heroku rollback v<N> -a $HEROKU_APP_NAME"
