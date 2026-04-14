from __future__ import annotations

import platform as _platform
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple


def _normalize_platform(system_name: str) -> str:
    s = (system_name or "").strip()
    if s.lower().startswith("win"):
        return "windows"
    if s.lower() in {"darwin", "mac", "macos"}:
        return "mac"
    if s.lower().startswith("linux"):
        return "linux"
    return "unknown"


def detect_platform() -> str:
    return _normalize_platform(_platform.system())


def _run(cmd: List[str], cwd: Path) -> Tuple[int, str, str]:
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        return proc.returncode, proc.stdout or "", proc.stderr or ""
    except Exception as e:
        return 1, "", str(e)


def trigger_fix(tool_name: str, fix_type: str, platform: str) -> Dict:
    """
    Runs platform-specific fix scripts.
    fix_type: "install" | "path" | "update"
    """
    plat = platform or detect_platform()
    scripts_dir = Path(__file__).resolve().parents[1] / "scripts"

    if fix_type not in {"install", "path", "update"}:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Invalid fix_type: {fix_type}",
            "command_executed": "",
        }

    effective_fix = fix_type

    if plat == "windows":
        script = scripts_dir / ("install_deps.ps1" if effective_fix in {"install", "update"} else "fix_path_vars.ps1")
        cmd = [
            "powershell",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(script),
            "-ToolName",
            tool_name,
        ]
        if effective_fix in {"install", "update"}:
            cmd.extend(["-FixType", effective_fix])
        rc, out, err = _run(cmd, cwd=scripts_dir)
        return {
            "success": rc == 0,
            "stdout": out,
            "stderr": err,
            "command_executed": " ".join(cmd),
        }

    if plat in {"mac", "linux"}:
        script = scripts_dir / ("install_deps.sh" if effective_fix in {"install", "update"} else "fix_path_vars.sh")
        cmd = ["bash", str(script), tool_name]
        if effective_fix in {"install", "update"}:
            cmd.append(effective_fix)
        rc, out, err = _run(cmd, cwd=scripts_dir)
        return {
            "success": rc == 0,
            "stdout": out,
            "stderr": err,
            "command_executed": " ".join(cmd),
        }

    return {
        "success": False,
        "stdout": "",
        "stderr": f"Unsupported platform: {plat}",
        "command_executed": "",
    }

