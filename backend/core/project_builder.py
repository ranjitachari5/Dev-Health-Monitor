"""
project_builder.py
Handles environment prerequisite checks and async project bootstrapping
for the Smart Project Bootstrapper feature.
"""

import asyncio
import shutil
import json
import os
from pathlib import Path


# ---------------------------------------------------------------------------
# Config loader
# ---------------------------------------------------------------------------

_CONFIG_PATH = Path(__file__).parent.parent / "config.json"


def _load_stacks() -> dict:
    """Load the project_stacks section from config.json."""
    with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    return cfg.get("project_stacks", {})


# ---------------------------------------------------------------------------
# ProjectBootstrapper
# ---------------------------------------------------------------------------

class ProjectBootstrapper:
    """Provides environment testing and project scaffolding for known stacks."""

    # ------------------------------------------------------------------
    # 1. Environment Testing
    # ------------------------------------------------------------------

    def test_stack_env(self, stack_name: str) -> dict:
        """
        Check whether all required tools for *stack_name* are present on PATH.

        Returns a dict like:
        {
            "stack": "react_vite",
            "label": "React + Vite",
            "ready": True,
            "checks": [
                {"tool": "node", "found": True,  "path": "/usr/bin/node"},
                {"tool": "npm",  "found": False, "path": null},
            ]
        }
        """
        stacks = _load_stacks()

        if stack_name not in stacks:
            return {
                "stack": stack_name,
                "ready": False,
                "error": f"Unknown stack '{stack_name}'. "
                         f"Available: {list(stacks.keys())}",
                "checks": [],
            }

        stack_cfg = stacks[stack_name]
        required_tools: list[str] = stack_cfg.get("requires", [])

        checks = []
        for tool in required_tools:
            tool_path = shutil.which(tool)
            checks.append(
                {
                    "tool": tool,
                    "found": tool_path is not None,
                    "path": tool_path,
                }
            )

        all_found = all(c["found"] for c in checks)

        return {
            "stack": stack_name,
            "label": stack_cfg.get("label", stack_name),
            "description": stack_cfg.get("description", ""),
            "ready": all_found,
            "checks": checks,
        }

    # ------------------------------------------------------------------
    # 2. Async Project Bootstrapping
    # ------------------------------------------------------------------

    async def bootstrap_stack(self, stack_name: str, project_name: str) -> dict:
        """
        Run the bootstrap command for *stack_name* asynchronously.

        The bootstrap_cmd template in config.json may contain the
        ``{project_name}`` placeholder which is substituted before execution.

        Returns a dict like:
        {
            "stack": "react_vite",
            "project_name": "my-app",
            "success": True,
            "stdout": "...",
            "stderr": "...",
            "returncode": 0,
        }
        """
        stacks = _load_stacks()

        if stack_name not in stacks:
            return {
                "stack": stack_name,
                "project_name": project_name,
                "success": False,
                "error": f"Unknown stack '{stack_name}'. "
                         f"Available: {list(stacks.keys())}",
                "stdout": "",
                "stderr": "",
                "returncode": -1,
            }

        stack_cfg = stacks[stack_name]
        raw_cmd: str = stack_cfg.get("bootstrap_cmd", "")

        # Substitute placeholders
        safe_name = project_name.strip().replace(" ", "-") or "my-project"
        cmd = raw_cmd.replace("{project_name}", safe_name)

        try:
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                # On Windows the shell is cmd.exe; /bin/sh elsewhere.
                shell=True,
            )

            # Wait with a generous timeout (5 minutes) to allow npm/pip to download
            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(), timeout=300
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.communicate()
                return {
                    "stack": stack_name,
                    "project_name": safe_name,
                    "success": False,
                    "error": "Bootstrap command timed out after 5 minutes.",
                    "stdout": "",
                    "stderr": "",
                    "returncode": -1,
                }

            stdout = stdout_bytes.decode("utf-8", errors="replace")
            stderr = stderr_bytes.decode("utf-8", errors="replace")
            success = process.returncode == 0

            return {
                "stack": stack_name,
                "label": stack_cfg.get("label", stack_name),
                "project_name": safe_name,
                "command_run": cmd,
                "success": success,
                "stdout": stdout,
                "stderr": stderr,
                "returncode": process.returncode,
            }

        except Exception as exc:  # noqa: BLE001
            return {
                "stack": stack_name,
                "project_name": safe_name,
                "success": False,
                "error": f"Unexpected error during bootstrap: {exc}",
                "stdout": "",
                "stderr": "",
                "returncode": -1,
            }
