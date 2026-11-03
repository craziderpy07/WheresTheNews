from pathlib import Path
import sys

from dotenv import load_dotenv


def load_environment():
    """Shell settings win, then scripts/.env, then the repository .env."""
    scripts_dir = Path(__file__).resolve().parent
    load_dotenv(scripts_dir / ".env")
    load_dotenv(scripts_dir.parent / ".env")


def configure_output():
    """Historical names must also be printable in Windows consoles/log files."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="backslashreplace")
