# Raspberry Pi WebSocket client

This client connects to the Windows PC through Tailscale. The Raspberry Pi and
Windows PC can be in different locations, behind different routers, and on
different internet connections.

Tailscale provides the encrypted private network. The WebSocket client sends
`Hello from Raspberry Pi` every few seconds and reconnects automatically if
the connection is interrupted.

## Requirements

- Raspberry Pi running Ubuntu
- Python 3.10 or newer
- Internet access
- Tailscale installed on the Raspberry Pi and Windows PC
- Both devices signed in to the same Tailscale network

## 1. Install Tailscale on the Raspberry Pi

Follow the [official Tailscale Linux instructions](https://tailscale.com/docs/install/linux)
or run:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Open the authentication URL printed by `tailscale up` and sign in to the same
Tailscale account used on the Windows PC.

Verify the connection:

```bash
tailscale status
tailscale ip -4
```

The returned `100.x.y.z` address is the Raspberry Pi's stable Tailscale IPv4
address.

## 2. Configure the Python client

Copy the `raspy_coms` folder to the Raspberry Pi, open a terminal in it, and
run:

```bash
sudo apt update
sudo apt install -y python3 python3-venv
python3 --version

python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

cp .env.example .env
nano .env
```

On the Windows PC, run this in PowerShell:

```powershell
tailscale ip -4
```

Put the returned Windows Tailscale IPv4 address in the Raspberry Pi's `.env`:

```dotenv
PC_SERVER_IP=100.101.102.103
PC_SERVER_PORT=8765
MESSAGE_INTERVAL_SECONDS=5
RECONNECT_DELAY_SECONDS=5
```

Do not use the Windows LAN address such as `192.168.x.x`. Replace the example
`100.101.102.103` with the actual address printed on the Windows PC.

## 3. Test connectivity and run

After starting the WebSocket server on Windows, test the private network from
the Raspberry Pi:

```bash
tailscale ping 100.101.102.103
python client.py
```

Replace the example address in the ping command with the Windows Tailscale
address. Press `Ctrl+C` to stop the client.

If Tailscale ping succeeds but the client cannot connect, check that the
Windows server is running and that Windows Firewall permits TCP port `8765`
from the Raspberry Pi's Tailscale IP.
