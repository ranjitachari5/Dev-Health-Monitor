import json
from pathlib import Path
from typing import Optional

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.json"


def load_config() -> dict:
    """Load the full configuration from config.json."""
    if not CONFIG_PATH.exists():
        return {}
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)


def get_tool_config(tool_name: str) -> Optional[dict]:
    """
    Return the configuration for a specific tool, or None if not found.
    Example return: {"required_version": "3.10.0", "cmd": ["python", "--version"]}
    """
    config = load_config()
    return config.get("tools", {}).get(tool_name.lower())


def get_scan_config() -> dict:
    """Return the scan configuration section."""
    config = load_config()
    return config.get("scan", {})


def get_server_config() -> dict:
    """Return the server configuration section."""
    config = load_config()
    return config.get("server", {})