from __future__ import annotations

import platform as _platform
import re
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Tuple

from .config_parser import get_config_value


_SEMVER_RE = re.compile(r"\d+\.\d+[\.\d]*")


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


def _extract_version(text: str) -> Optional[str]:
    if not text:
        return None
    m = _SEMVER_RE.search(text)
    return m.group(0) if m else None


def _run_command(cmd: List[str], timeout_seconds: int) -> Tuple[int, str, str]:
    """
    Returns (returncode, stdout, stderr). Never raises.
    """
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
        return proc.returncode, proc.stdout or "", proc.stderr or ""
    except FileNotFoundError:
        return 127, "", "FileNotFoundError"
    except subprocess.TimeoutExpired:
        return 124, "", "TimeoutExpired"
    except PermissionError:
        return 126, "", "PermissionError"
    except OSError as e:
        return 125, "", f"OSError: {e}"
    except Exception as e:
        return 125, "", f"Exception: {e}"


def _status_from_result(is_installed: bool, version: Optional[str], tool_name: str) -> str:
    if not is_installed:
        return "Critical"
    if version is None:
        # Some tools may not report semver cleanly; treat as Warning (installed, unknown version)
        return "Warning"
    return "Healthy"


def _tool_commands(platform_name: str) -> Dict[str, List[List[str]]]:
    """
    Map tool_name -> list of candidate commands (argv lists).
    We try in order until one succeeds.
    """
    cmds: Dict[str, List[List[str]]] = {
        # Languages
        "python": [["python", "--version"], ["python3", "--version"]],
        "node": [["node", "--version"]],
        "java": [["java", "-version"]],
        "ruby": [["ruby", "--version"]],
        "go": [["go", "version"]],
        "rust": [["rustc", "--version"]],
        "php": [["php", "--version"]],
        # Package managers
        "npm": [["npm", "--version"]],
        "pip": [["pip", "--version"], ["pip3", "--version"]],
        "yarn": [["yarn", "--version"]],
        "pnpm": [["pnpm", "--version"]],
        "composer": [["composer", "--version"]],
        # Version control
        "git": [["git", "--version"]],
        "gh": [["gh", "--version"]],
        # Databases
        "postgresql": [["psql", "--version"]],
        "mysql": [["mysql", "--version"]],
        "mongodb": [["mongod", "--version"]],
        "redis": [["redis-server", "--version"]],
        "sqlite": [["sqlite3", "--version"]],
        # DevOps / Cloud
        "docker": [["docker", "--version"]],
        "docker-compose": [["docker-compose", "--version"]],
        "kubectl": [["kubectl", "version", "--client"]],
        "terraform": [["terraform", "--version"]],
        "aws": [["aws", "--version"]],
        "gcloud": [["gcloud", "--version"]],
        "az": [["az", "--version"]],
        # Runtimes / Build tools
        "dotnet": [["dotnet", "--version"]],
        "gradle": [["gradle", "--version"]],
        "maven": [["mvn", "--version"]],
        "make": [["make", "--version"]],
        # Editors / IDEs
        "vscode": [["code", "--version"]],
        "vim": [["vim", "--version"]],
    }
    return cmds


def check_tool(tool_name: str) -> Dict:
    """
    Physically checks the real machine using subprocess + PATH lookup.
    Never raises; returns status "Unknown" if detection fails unexpectedly.
    """
    platform_name = detect_platform()
    timeout_seconds = int(get_config_value("scan.subprocess_timeout_seconds", 8) or 8)

    result = {
        "tool_name": tool_name,
        "is_installed": False,
        "current_version": None,
        "install_command": None,
        "status": "Unknown",
        "required_version": None,
        "platform": platform_name,
    }

    try:
        tool_map = _tool_commands(platform_name)
        candidates = tool_map.get(tool_name, [])

        last_stdout = ""
        last_stderr = ""
        installed = False
        used_cmd: Optional[List[str]] = None
        version: Optional[str] = None

        for cmd in candidates:
            rc, out, err = _run_command(cmd, timeout_seconds=timeout_seconds)
            last_stdout, last_stderr = out, err
            used_cmd = cmd

            combined = (out or "") + "\n" + (err or "")
            found_version = _extract_version(combined)

            # Consider installed if command executed (not FileNotFoundError) even with nonzero code,
            # because some commands print version and return nonzero.
            if rc not in {127} and (found_version or out or err):
                installed = True
                version = found_version
                break

        # Fallback: check PATH presence if known binary exists
        if not installed:
            which_name = tool_name
            # adjust for special cases
            if tool_name == "postgresql":
                which_name = "psql"
            elif tool_name == "mongodb":
                which_name = "mongod"
            elif tool_name == "redis":
                which_name = "redis-server"
            elif tool_name == "docker-compose":
                which_name = "docker-compose"
            elif tool_name == "maven":
                which_name = "mvn"
            elif tool_name == "vscode":
                which_name = "code"
            elif tool_name == "sqlite":
                which_name = "sqlite3"
            elif tool_name == "rust":
                which_name = "rustc"

            if shutil.which(which_name):
                installed = True

        result["is_installed"] = bool(installed)
        result["current_version"] = version
        result["install_command"] = " ".join(used_cmd) if used_cmd else None
        result["status"] = _status_from_result(installed, version, tool_name)
        return result

    except Exception:
        return result


def scan_all_tools() -> List[Dict]:
    tools = [
        "python",
        "node",
        "java",
        "ruby",
        "go",
        "rust",
        "php",
        "npm",
        "pip",
        "yarn",
        "pnpm",
        "composer",
        "git",
        "gh",
        "postgresql",
        "mysql",
        "mongodb",
        "redis",
        "sqlite",
        "docker",
        "docker-compose",
        "kubectl",
        "terraform",
        "aws",
        "gcloud",
        "az",
        "dotnet",
        "gradle",
        "maven",
        "make",
        "vscode",
        "vim",
    ]

    max_workers = int(get_config_value("scan.max_workers", 24) or 24)
    results: List[Dict] = []

    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(check_tool, t): t for t in tools}
        for fut in as_completed(futures):
            try:
                results.append(fut.result())
            except Exception:
                results.append(
                    {
                        "tool_name": futures[fut],
                        "is_installed": False,
                        "current_version": None,
                        "install_command": None,
                        "status": "Unknown",
                        "required_version": None,
                        "platform": detect_platform(),
                    }
                )

    # Stable ordering for API clients
    results.sort(key=lambda x: str(x.get("tool_name", "")))
    return results

