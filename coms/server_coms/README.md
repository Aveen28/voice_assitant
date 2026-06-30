# Windows WebSocket server

This server listens on all network interfaces on port `8765`. It prints each
client connection and message, then replies with
`Server received: <message>`.

## Requirements

- Windows 10 or Windows 11
- Python 3.10 or newer
- Windows PC and Raspberry Pi connected to the same network

## Setup on Windows

Open PowerShell in the `server_coms` folder and run:

```powershell
py -3.10 -m venv .venv

# Run this only if PowerShell blocks activation in the current window:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

Copy-Item .env.example .env
python server.py
```

The server should print:

```text
WebSocket server listening on ws://0.0.0.0:8765
```

Press `Ctrl+C` to stop it.

## Connect the Raspberry Pi

Run `ipconfig` in PowerShell and find the IPv4 address for the network adapter
connected to the Raspberry Pi's network. Put that address in the Raspberry
Pi client's `.env` file as `PC_SERVER_IP`.

If Windows asks whether Python may communicate through the firewall, allow it
on private networks. If no prompt appears and the client cannot connect, open
TCP port `8765` for private networks in Windows Defender Firewall. Do not use
`0.0.0.0` as the client address; it is only the server's listen address.
