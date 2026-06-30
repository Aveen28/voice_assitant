import asyncio
import os

from dotenv import load_dotenv
from websockets.asyncio.client import connect
from websockets.exceptions import ConnectionClosed


load_dotenv()

SERVER_IP = os.getenv("PC_SERVER_IP")
SERVER_PORT = os.getenv("PC_SERVER_PORT", "8765")
MESSAGE_INTERVAL_SECONDS = float(os.getenv("MESSAGE_INTERVAL_SECONDS", "5"))
RECONNECT_DELAY_SECONDS = float(os.getenv("RECONNECT_DELAY_SECONDS", "5"))
TEST_MESSAGE = "Hello from Raspberry Pi"


async def run_client() -> None:
    if not SERVER_IP:
        raise ValueError(
            "PC_SERVER_IP is not set. Copy .env.example to .env and add the "
            "Windows PC's local IP address."
        )

    server_url = f"ws://{SERVER_IP}:{SERVER_PORT}"

    while True:
        try:
            print(f"Connecting to {server_url}...")

            async with connect(server_url) as websocket:
                print("Connected to server.")

                while True:
                    await websocket.send(TEST_MESSAGE)
                    print(f"Sent: {TEST_MESSAGE}")

                    reply = await websocket.recv()
                    print(f"Received: {reply}")

                    await asyncio.sleep(MESSAGE_INTERVAL_SECONDS)

        except (ConnectionClosed, OSError) as error:
            print(f"Connection failed or closed: {error}")
            print(f"Retrying in {RECONNECT_DELAY_SECONDS} seconds...")
            await asyncio.sleep(RECONNECT_DELAY_SECONDS)


if __name__ == "__main__":
    try:
        asyncio.run(run_client())
    except KeyboardInterrupt:
        print("\nClient stopped.")
