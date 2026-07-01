#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
AUTOSTART_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/autostart"
DESKTOP_FILE="$AUTOSTART_DIR/pi-orb-assistant.desktop"

mkdir -p "$AUTOSTART_DIR"
chmod +x "$ROOT_DIR/scripts/setup-pi.sh" "$ROOT_DIR/scripts/start-pi.sh"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Pi Orb Assistant
Exec="$ROOT_DIR/scripts/start-pi.sh"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

printf 'Installed autostart entry: %s\n' "$DESKTOP_FILE"
