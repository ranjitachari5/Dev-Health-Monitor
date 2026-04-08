import subprocess
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"


def trigger_fix(tool_name: str, fix_type: str) -> dict:
    """
    Execute the appropriate PowerShell fix script for a given tool.

    Args:
        tool_name: The name of the tool to fix (e.g., "python", "git").
        fix_type: Either "install" or "path".

    Returns:
        A dict with 'success' (bool), 'stdout', and 'stderr' fields.
    """
    script_map = {
        "install": SCRIPTS_DIR / "install_deps.ps1",
        "path": SCRIPTS_DIR / "fix_path_vars.ps1",
    }

    script_path = script_map.get(fix_type)
    if not script_path:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Unknown fix_type '{fix_type}'. Must be 'install' or 'path'.",
        }

    if not script_path.exists():
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Script not found at path: {script_path}",
        }

    try:
        result = subprocess.run(
            [
                "powershell.exe",
                "-ExecutionPolicy", "Bypass",
                "-File", str(script_path),
                tool_name,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }

    except FileNotFoundError:
        return {
            "success": False,
            "stdout": "",
            "stderr": "powershell.exe not found. Are you running on Windows?",
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": "PowerShell script timed out after 30 seconds.",
        }