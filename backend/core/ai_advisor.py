from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

from openai import OpenAI

from .config_parser import get_config_value


def _get_client() -> Optional[OpenAI]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def _extract_json_object(text: str) -> Optional[str]:
    """
    Best-effort extraction if the model accidentally wraps JSON with extra text.
    """
    if not text:
        return None
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        return text
    m = re.search(r"\{[\s\S]*\}", text)
    return m.group(0) if m else None


def analyze_project(user_description: str, scan_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    client = _get_client()
    if client is None:
        return {
            "error": "OPENAI_API_KEY is missing. Set it in backend/.env or your environment.",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable because OPENAI_API_KEY is not configured.",
            "critical_issues": ["Missing OPENAI_API_KEY"],
            "recommendations": [
                "Create backend/.env with OPENAI_API_KEY=... and restart the server."
            ],
        }

    model = str(get_config_value("openai.model", "gpt-4o") or "gpt-4o")

    system_prompt = (
        "You are a senior DevOps engineer. A developer has described their project. "
        "Based on their description and their current machine scan, return a JSON "
        "object with:\n"
        "- required_tools: list of tool names they need\n"
        "- version_requirements: {tool_name: recommended_version_string}\n"
        "- missing_tools: list of tool names not installed\n"
        "- outdated_tools: list of tools where current version is below recommended\n"
        "- health_summary: one paragraph plain English summary\n"
        "- critical_issues: list of blocking issues they must fix first\n"
        "- recommendations: list of actionable fix steps in plain English\n"
        "Respond ONLY with valid JSON, no markdown."
    )

    user_message = (
        f"Project description: {user_description}\n"
        f"Current machine scan: {json.dumps(scan_results, indent=2)}"
    )

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )
        content = (resp.choices[0].message.content or "").strip()
        raw_json = _extract_json_object(content) or content
        try:
            data = json.loads(raw_json)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError as e:
            return {
                "error": f"Failed to parse AI JSON response: {e}",
                "raw_response": content,
                "required_tools": [],
                "version_requirements": {},
                "missing_tools": [],
                "outdated_tools": [],
                "health_summary": "AI response could not be parsed as JSON.",
                "critical_issues": ["AI JSON parse failure"],
                "recommendations": ["Try again. If it persists, inspect raw_response."],
            }
        return {
            "error": "AI response was not a JSON object.",
            "raw_response": content,
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI response was not a JSON object.",
            "critical_issues": ["AI response shape invalid"],
            "recommendations": ["Try again. If it persists, inspect raw_response."],
        }
    except Exception as e:
        return {
            "error": f"OpenAI call failed: {e}",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable due to an OpenAI error.",
            "critical_issues": ["OpenAI request failed"],
            "recommendations": ["Verify network access and OPENAI_API_KEY, then retry."],
        }


def get_install_command(tool_name: str, platform: str) -> Dict[str, Any]:
    client = _get_client()
    if client is None:
        return {
            "tool": tool_name,
            "platform": platform,
            "command": "",
            "notes": "OPENAI_API_KEY is missing. Set it in backend/.env or your environment.",
            "error": "Missing OPENAI_API_KEY",
        }

    model = str(get_config_value("openai.model", "gpt-4o") or "gpt-4o")
    prompt = (
        f"What is the exact terminal command to install {tool_name} on {platform}? "
        "Return JSON only:\n"
        "{\n"
        "  'tool': str,\n"
        "  'platform': str,\n"
        "  'command': str,\n"
        "  'notes': str\n"
        "}"
    )

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Respond ONLY with valid JSON, no markdown."},
                {"role": "user", "content": prompt},
            ],
        )
        content = (resp.choices[0].message.content or "").strip()
        raw_json = _extract_json_object(content) or content
        try:
            data = json.loads(raw_json)
            if isinstance(data, dict):
                # normalize minimal expected keys
                return {
                    "tool": str(data.get("tool", tool_name)),
                    "platform": str(data.get("platform", platform)),
                    "command": str(data.get("command", "")),
                    "notes": str(data.get("notes", "")),
                }
        except json.JSONDecodeError as e:
            return {
                "tool": tool_name,
                "platform": platform,
                "command": "",
                "notes": "AI response could not be parsed as JSON.",
                "error": f"JSON parse error: {e}",
                "raw_response": content,
            }
        return {
            "tool": tool_name,
            "platform": platform,
            "command": "",
            "notes": "AI response was not a JSON object.",
            "error": "AI response shape invalid",
            "raw_response": content,
        }
    except Exception as e:
        return {
            "tool": tool_name,
            "platform": platform,
            "command": "",
            "notes": "OpenAI request failed.",
            "error": str(e),
        }

