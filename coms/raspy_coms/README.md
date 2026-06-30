# Raspberry Pi WebSocket client

This client connects to the Windows PC, sends `Hello from Raspberry Pi` every
few seconds, and prints the server's reply. If the connection fails or closes,
it waits and reconnects automatically.

## Requirements

- Raspberry Pi running Ubuntu
- Python 3.10 or newer
- Raspberry Pi and Windows PC connected to the same network

## Setup on the Raspberry Pi

Copy the `raspy_coms` folder to the Raspberry Pi. Then open a terminal in that
folder and run:

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

Set `PC_SERVER_IP` in `.env` to the Windows PC's IPv4 address. On the Windows
PC, run `ipconfig` and use the IPv4 address for the network adapter connected
to the Raspberry Pi's network. Keep `PC_SERVER_PORT=8765` unless the server
configuration is changed.

Example:

```dotenv
PC_SERVER_IP=192.168.1.50
PC_SERVER_PORT=8765
MESSAGE_INTERVAL_SECONDS=5
RECONNECT_DELAY_SECONDS=5
```

Start the client:

```bash
python client.py
```

Press `Ctrl+C` to stop it.

If it cannot connect, confirm that the Windows server is running, both devices
are on the same network, the IP address is correct, and Windows Firewall allows
inbound TCP traffic on port `8765`.
