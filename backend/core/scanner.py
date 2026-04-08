import subprocess
from typing import Optional

from core.config_parser import load_config, get_tool_config, get_scan_config

def _parse_version(output: str) -> Optional[str]:
    """Extract the first version-like token (X.Y.Z) from command output."""
    import re
    match = re.search(r"\d+\.\d+[\.\d]*", output)
    return match.group(0) if match else None


def check_tool_installed(tool_name: str) -> dict:
    """
    Check if a tool is installed on the Windows system.
    Returns a dict compatible with ToolHealth fields.
    """
    config = get_tool_config(tool_name)
    if not config:
        return {
            "tool_name": tool_name,
            "is_installed": False,
            "current_version": None,
            "required_version": "unknown",
            "status": "Critical",
        }

    try:
        result = subprocess.run(
            config["cmd"],
            capture_output=True,
            text=True,
            timeout=get_scan_config().get("timeout_seconds", 10),
        )
        raw_output = result.stdout.strip() or result.stderr.strip()
        current_version = _parse_version(raw_output)

        if current_version:
            status = "Healthy"
        else:
            status = "Warning"

        return {
            "tool_name": tool_name,
            "is_installed": True,
            "current_version": current_version,
            "required_version": config["required_version"],
            "status": status,
        }

    except FileNotFoundError:
        return {
            "tool_name": tool_name,
            "is_installed": False,
            "current_version": None,
            "required_version": config["required_version"],
            "status": "Critical",
        }
    except subprocess.TimeoutExpired:
        return {
            "tool_name": tool_name,
            "is_installed": False,
            "current_version": None,
            "required_version": config["required_version"],
            "status": "Warning",
        }


def run_full_scan() -> list[dict]:
    """Scan all known tools and return their health dicts."""
    tools = load_config().get("tools", {})
    return [check_tool_installed(tool) for tool in tools.keys()]


def compute_overall_score(results: list[dict]) -> int:
    """
    Score from 0–100 based on how many tools are Healthy.
    Healthy = 100pts, Warning = 50pts, Critical = 0pts per tool.
    """
    if not results:
        return 0
    points = get_scan_config().get("score_weights", {"Healthy": 100, "Warning": 50, "Critical": 0})
    total = sum(points.get(r["status"], 0) for r in results)
    return total // len(results)