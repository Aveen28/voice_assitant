#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${ORB_HOST:-127.0.0.1}"
PORT="${ORB_PORT:-4173}"
URL="http://${HOST}:${PORT}"
SERVER_PID=""

cd "$ROOT_DIR"

if [[ ! -f dist/index.html ]]; then
  "$ROOT_DIR/scripts/setup-pi.sh"
fi

if command -v chromium >/dev/null 2>&1; then
  CHROMIUM_BIN="$(command -v chromium)"
elif command -v chromium-browser >/dev/null 2>&1; then
  CHROMIUM_BIN="$(command -v chromium-browser)"
else
  printf 'Chromium is not installed.\n' >&2
  exit 1
fi

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID"
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

npm run preview -- --host "$HOST" --port "$PORT" --strictPort &
SERVER_PID=$!

READY=0
for _ in {1..50}; do
  if curl --fail --silent --show-error "$URL" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.2
done

if (( READY == 0 )); then
  printf 'The local UI server did not start at %s.\n' "$URL" >&2
  exit 1
fi

CHROMIUM_ARGS=(
  --kiosk
  --noerrdialogs
  --disable-infobars
  --disable-session-crashed-bubble
  --disable-accelerated-video-decode
  --disable-accelerated-video-encode
  --disable-background-networking
  --disable-component-extensions-with-background-pages
  --disable-pinch
  --overscroll-history-navigation=0
  --autoplay-policy=no-user-gesture-required
)

if [[ "${ORB_AUTO_ALLOW_MIC:-0}" == "1" ]]; then
  CHROMIUM_ARGS+=(--use-fake-ui-for-media-stream)
fi

filter_chromium_stderr() {
  while IFS= read -r line; do
    case "$line" in
      *'Not loading module "atk-bridge"'*)
        ;;
      *"vaInitialize failed: unknown libva error"*)
        ;;
      *"org.gnome.Mutter.IdleMonitor.AddIdleWatch:"*"AppArmor policy prevents"*)
        ;;
      *":ERROR:google_apis/gcm/"*)
        ;;
      *)
        printf '%s\n' "$line" >&2
        ;;
    esac
  done
}

GTK_MODULES='' "$CHROMIUM_BIN" "${CHROMIUM_ARGS[@]}" "$URL" \
  2> >(filter_chromium_stderr)
