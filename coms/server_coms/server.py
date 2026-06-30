import asyncio
import os

from dotenv import load_dotenv
from websockets.asyncio.server import ServerConnection, serve
from websockets.exceptions import ConnectionClosed


load_dotenv()

HOST = os.getenv("WS_HOST", "0.0.0.0")
PORT = int(os.getenv("WS_PORT", "8765"))


async def handle_client(websocket: ServerConnection) -> None:
    client_address = websocket.remote_address
    print(f"Client connected: {client_address}")

    try:
        async for message in websocket:
            print(f"Received from {client_address}: {message}")
            await websocket.send(f"Server received: {message}")
    except ConnectionClosed:
        pass
    finally:
        print(f"Client disconnected: {client_address}")


async def main() -> None:
    print(f"WebSocket server listening on ws://{HOST}:{PORT}")

    async with serve(handle_client, HOST, PORT):
        await asyncio.get_running_loop().create_future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")
