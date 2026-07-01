# Pi Orb Assistant

Lightweight Canvas 2D assistant interface designed for a Raspberry Pi 5 running 64-bit Ubuntu and Chromium.

## Requirements

- Node.js `20.19+` or `22.12+`; Node.js 22 LTS is recommended
- npm
- Chromium or Chromium Browser
- curl

## Local development

```bash
npm ci
npm run dev
```

Open the URL printed by Vite.

## Raspberry Pi setup

Clone the repository on the Pi, then run:

```bash
cd ui_3
chmod +x scripts/*.sh
./scripts/setup-pi.sh
./scripts/start-pi.sh
```

`setup-pi.sh` validates the runtime, installs locked dependencies, and creates the production build. `start-pi.sh` serves that build only on `127.0.0.1` and opens Chromium in kiosk mode.

On the first microphone start, allow Chromium microphone access. For a trusted, dedicated local robot installation, permission can be accepted automatically:

```bash
ORB_AUTO_ALLOW_MIC=1 ./scripts/start-pi.sh
```

## Start automatically after Ubuntu login

```bash
./scripts/install-pi-autostart.sh
```

Log out and back in to test it. Remove `~/.config/autostart/pi-orb-assistant.desktop` to disable autostart.

## Configuration

- Performance and renderer defaults: `src/config/settings.ts`
- State colors and animation behavior: `src/config/states.ts`
- Kiosk host and port: `ORB_HOST` and `ORB_PORT`

The microphone works because Chromium treats `http://localhost` and `http://127.0.0.1` as secure local contexts.

## Publish to GitHub

After creating an empty repository on GitHub:

```bash
git add .
git commit -m "Initial Raspberry Pi orb UI"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```
