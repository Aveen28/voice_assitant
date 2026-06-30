# Windows WebSocket server

This server receives WebSocket messages from a remote Raspberry Pi through
Tailscale. The devices do not need to share a Wi-Fi network, router, or
physical location.

The server listens on `0.0.0.0:8765`, prints every connection and message, and
replies with `Server received: <message>`.

## Requirements

- Windows 10 or Windows 11
- Python 3.10 or newer
- Internet access
- Tailscale installed on the Windows PC and Raspberry Pi
- Both devices signed in to the same Tailscale network

## 1. Install Tailscale on Windows

Install Tailscale using the
[official Windows instructions](https://tailscale.com/docs/install/windows),
then sign in. Use the same Tailscale account or network as the Raspberry Pi.

Open PowerShell and verify the connection:

```powershell
tailscale status
tailscale ip -4
```

Save the returned `100.x.y.z` address. This is the stable Windows Tailscale
IPv4 address that must be placed in the Raspberry Pi client's `.env`.

## 2. Set up and start the server

Open PowerShell in the `server_coms` folder and run:

```powershell
python3.10 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

Copy-Item .env.example .env
.\.venv\Scripts\python.exe server.py
```

The server should print:

```text
WebSocket server listening on ws://0.0.0.0:8765
```

Press `Ctrl+C` to stop it.

## 3. Allow only the Raspberry Pi through Windows Firewall

On the Raspberry Pi, get its Tailscale IPv4 address:

```bash
tailscale ip -4
```

Then open PowerShell as Administrator on Windows and create an inbound rule.
Replace `100.110.120.130` with the Raspberry Pi's actual Tailscale address:

```powershell
New-NetFirewallRule `
  -DisplayName "Raspberry Pi WebSocket 8765" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 8765 `
  -RemoteAddress 100.110.120.130
```

No router port forwarding or public IP address is required. Do not expose port
`8765` directly to the public internet; this test server does not implement
application-level authentication or TLS.
