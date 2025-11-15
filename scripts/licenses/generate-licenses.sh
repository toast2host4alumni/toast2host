#!/usr/bin/env bash
set -euo pipefail

echo "This script generates THIRD_PARTY_LICENSES.md for frontend and backend dependencies."
echo "Prereqs: install license-checker (npm i -g license-checker) or run via npx."

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)

out="$ROOT_DIR/THIRD_PARTY_LICENSES.md"
echo "# Third-Party Licenses" > "$out"
echo >> "$out"

gen() {
  local dir="$1"
  if [ -f "$dir/package.json" ]; then
    echo "## $(basename "$dir")" >> "$out"
    echo >> "$out"
    (cd "$dir" && npx --yes license-checker --production --json) | jq -r 'to_entries[] | "- \(.key) — \(.value.licenses)"' >> "$out" || true
    echo >> "$out"
  fi
}

gen "$ROOT_DIR/frontend"
gen "$ROOT_DIR/backend"

echo "Wrote $out"

