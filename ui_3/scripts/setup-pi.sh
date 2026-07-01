#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

for dependency in node npm chromium curl; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    if [[ "$dependency" == "chromium" ]] && command -v chromium-browser >/dev/null 2>&1; then
      continue
    fi
    printf 'Missing required command: %s\n' "$dependency" >&2
    exit 1
  fi
done

read -r NODE_MAJOR NODE_MINOR < <(
  node -p "process.versions.node.split('.').slice(0, 2).join(' ')"
)

if ! {
  (( NODE_MAJOR == 20 && NODE_MINOR >= 19 )) ||
  (( NODE_MAJOR == 22 && NODE_MINOR >= 12 )) ||
  (( NODE_MAJOR > 22 ));
}; then
  printf 'Node.js 20.19+ or 22.12+ is required. Found %s.\n' "$(node --version)" >&2
  exit 1
fi

npm ci
npm run build

printf 'Pi Orb Assistant is built and ready.\n'
