#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Loads secrets from .env and starts the SmartStudy Spring Boot backend.
# Usage:  ./run.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Always run from the script's own directory (the backend root)
cd "$(dirname "$0")"

ENV_FILE=".env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE not found. Copy the template and fill in your secrets." >&2
  exit 1
fi

# Export every KEY=value line from .env into the environment
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# ── Validate required secrets ────────────────────────────────────────────────
missing=()
[[ -z "${DB_PASSWORD:-}" ]] && missing+=("DB_PASSWORD")
[[ -z "${JWT_SECRET:-}"  ]] && missing+=("JWT_SECRET")

if (( ${#missing[@]} > 0 )); then
  echo "✗ Missing required value(s) in .env: ${missing[*]}" >&2
  echo "  Edit $(pwd)/.env and set them, then re-run." >&2
  exit 1
fi

if [[ -z "${GROK_API_KEY:-}" ]]; then
  echo "WARNING: GROK_API_KEY is empty — AI analyze, PDF summarize & quiz generation will be disabled."
fi

echo "▶ Starting backend on port ${SERVER_PORT:-8080} …"
# Use system mvn if the Maven wrapper is absent
if [[ -f "./mvnw" && -f ".mvn/wrapper/maven-wrapper.properties" ]]; then
  exec ./mvnw spring-boot:run
else
  exec mvn spring-boot:run
fi
