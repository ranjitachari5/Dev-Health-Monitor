from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def load_config() -> Dict[str, Any]:
    """
    Loads backend/config.json. Returns {} on any error.
    """
    config_path = Path(__file__).resolve().parents[1] / "config.json"
    try:
        raw = config_path.read_text(encoding="utf-8")
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except Exception:
        return {}
    return {}


def get_config_value(path: str, default: Any = None) -> Any:
    """
    Fetch nested config value using dotted-path (e.g. "scan.max_workers").
    """
    data = load_config()
    cur: Any = data
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur

