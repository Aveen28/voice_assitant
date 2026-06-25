import asyncio
import os
import tempfile

import edge_tts
from playsound import playsound


TEXT = "Good evening, sir. Voice interface online. Local systems are stable. Diagnostics complete. I am ready for your command."
VOICE = "en-GB-RyanNeural"
RATE = "+0%"
PITCH = "-8Hz"
VOLUME = "+0%"


async def main():
    fd, path = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)
    try:
        await edge_tts.Communicate(TEXT, VOICE, rate=RATE, pitch=PITCH, volume=VOLUME).save(path)
        playsound(path)
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


asyncio.run(main())
