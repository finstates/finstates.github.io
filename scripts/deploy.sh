#!/bin/bash

set -euo pipefail

repository_dir="$(cd "$(dirname "$0")/.." && pwd)"
confirmation=""
dry_run=0

usage() {
  echo "Usage: scripts/deploy.sh --confirm DEPLOY_SITE"
  echo "       scripts/deploy.sh --dry-run"
}

fail() {
  echo "Site deployment failed: $*" >&2
  exit 1
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --confirm) shift; confirmation="${1:-}" ;;
    --dry-run) dry_run=1 ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; fail "Unknown argument: $1" ;;
  esac
  shift
done

for command_name in git node pnpm curl jq gh; do
  command -v "$command_name" >/dev/null || fail "$command_name is required."
done

cd "$repository_dir"

[[ "$(git branch --show-current)" == "main" ]] || fail "Deployments must run from main."
[[ -z "$(git status --porcelain)" ]] || fail "Commit or remove all worktree changes before deployment."
origin_url="$(git remote get-url origin)"
[[ "$origin_url" == *"finstates/finstates.github.io"* ]] || fail "origin does not point to finstates/finstates.github.io."

node_major="$(node -p 'process.versions.node.split(".")[0]')"
pnpm_major="$(pnpm --version | cut -d. -f1)"
[[ "$node_major" -ge 22 && "$node_major" -lt 25 ]] || fail "Node.js 22, 23 or 24 is required."
[[ "$pnpm_major" == "11" ]] || fail "pnpm 11 is required."
gh auth status >/dev/null

pnpm install --frozen-lockfile
pnpm check

git fetch origin main
git merge-base --is-ancestor origin/main HEAD || fail "Local main is behind or diverged from origin/main."

head_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse origin/main)"
expected_asset="$(find dist/assets -maxdepth 1 -type f -name 'main-*.js' -print | sed -n '1p' | xargs basename)"
[[ -n "$expected_asset" ]] || fail "The verified JavaScript asset could not be resolved."

if [[ "$dry_run" -eq 1 ]]; then
  echo "Site deployment dry run passed."
  echo "Commit: $head_sha"
  echo "Asset: $expected_asset"
  echo "Action: $([[ "$head_sha" == "$remote_sha" ]] && echo workflow_dispatch || echo push)"
  exit 0
fi

[[ "$confirmation" == "DEPLOY_SITE" ]] || fail "Confirmation text must be DEPLOY_SITE."

started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [[ "$head_sha" == "$remote_sha" ]]; then
  gh workflow run deploy.yml --ref main
else
  git push origin HEAD:main
fi

run_id=""
for _ in $(seq 1 30); do
  run_id="$(gh run list \
    --workflow deploy.yml \
    --branch main \
    --commit "$head_sha" \
    --limit 10 \
    --json databaseId,createdAt \
    --jq "map(select(.createdAt >= \"$started_at\")) | first | .databaseId // empty")"
  [[ -z "$run_id" ]] || break
  sleep 2
done
[[ -n "$run_id" ]] || fail "GitHub Pages workflow run was not created."

gh run watch "$run_id" --exit-status

live_ready=0
for _ in $(seq 1 30); do
  live_html="$(curl -fsS "https://finstates.app/register/?deployment=$head_sha" || true)"
  if [[ "$live_html" == *"/assets/$expected_asset"* ]]; then
    live_ready=1
    break
  fi
  sleep 2
done
[[ "$live_ready" -eq 1 ]] || fail "GitHub Pages completed but the expected asset is not live."

for route in / /account/ /register/ /register/confirm/ /privacy/ /terms/; do
  http_code="$(curl -sS -o /dev/null -w '%{http_code}' "https://finstates.app$route")"
  [[ "$http_code" == "200" ]] || fail "https://finstates.app$route returned HTTP $http_code."
done

api_response="$(mktemp /tmp/finstates-site-api.XXXXXX)"
api_headers="$(mktemp /tmp/finstates-site-api-headers.XXXXXX)"
trap 'find "$api_response" "$api_headers" -type f -delete' EXIT
api_status="$(curl -sS -D "$api_headers" -o "$api_response" -w '%{http_code}' \
  -X POST "https://api.finstates.app/v1/early-access/registrations" \
  -H "Origin: https://finstates.app" \
  -H "Content-Type: application/json" \
  --data '{"email":"invalid","productUpdates":false}')"
[[ "$api_status" == "400" ]] || fail "Registration API returned HTTP $api_status for its invalid-input contract."
jq -e '.error.code == "invalid_request"' "$api_response" >/dev/null \
  || fail "Registration API returned an unexpected invalid-input response."
tr -d '\r' < "$api_headers" | grep -Fxi 'access-control-allow-origin: https://finstates.app' >/dev/null \
  || fail "Registration API did not authorize the production website origin."

find "$api_response" "$api_headers" -type f -delete
trap - EXIT
echo "Site deployment complete: https://finstates.app/ (commit $head_sha, workflow $run_id)."
