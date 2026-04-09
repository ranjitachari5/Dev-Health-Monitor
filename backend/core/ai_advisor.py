from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from openai import AsyncOpenAI, OpenAI

from .config_parser import get_config_value

load_dotenv()

# Groq API (api.groq.com) - OpenAI-compatible, uses gsk_... keys
# Free tier supports llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it, etc.
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"  # Free model on Groq free tier

# Legacy aliases for backward compatibility
GROK_BASE_URL = GROQ_BASE_URL
GROK_MODEL = GROQ_MODEL


def _grok_sync_client() -> Optional[OpenAI]:
    # Support both GROQ_API_KEY (Groq) and GROK_API_KEY (legacy) env vars
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)


def _grok_async_client() -> Optional[AsyncOpenAI]:
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY")
    if not api_key:
        return None
    return AsyncOpenAI(api_key=api_key, base_url=GROQ_BASE_URL)


grok_client = _grok_async_client()


def _extract_json_object(text: str) -> Optional[str]:
    if not text:
        return None
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        return text
    m = re.search(r"\{[\s\S]*\}", text)
    return m.group(0) if m else None


RESOLVE_SYSTEM_PROMPT = """You are a developer environment expert. The user will describe their project or paste a list of detected tools. Your job is to return ONLY a valid JSON object — no markdown fences, no explanation, no preamble. The JSON must strictly follow this schema:

{
  "stack_name": "<short friendly name e.g. MERN Stack, Django + React>",
  "required_tools": [
    {
      "name": "<exact CLI binary name e.g. node, python3, docker, psql>",
      "display_name": "<human-readable name e.g. Node.js, Python, Docker>",
      "category": "<one of: runtime | package_manager | database | devtool | container | language>",
      "check_command": "<shell command to detect version e.g. node --version>",
      "install_url": "<official download page URL>",
      "min_version": "<minimum acceptable semver string e.g. 18.0.0, or null if any version is fine>",
      "why_needed": "<one sentence: why THIS project specifically needs this tool>"
    }
  ]
}

CRITICAL RULES you must follow:
- Include ONLY tools that are DIRECTLY required to run, build, or develop this specific project.
- DO NOT include generic unix utilities (curl, wget, bash, grep, sed, awk, git unless the project explicitly uses git workflows).
- DO NOT include tools from unrelated stacks. A Next.js project does not need python, java, or ruby.
- For a Node.js project: include node + npm (or yarn/pnpm if detected), nothing else unless docker or a DB CLI is needed.
- For a Python project: include python3 + pip, then the relevant framework CLI if applicable.
- Maximum 10 tools. Be selective. Quality over quantity.
- check_command must be a single shell command that outputs a version string to stdout or stderr.
"""


async def resolve_dependencies(user_input: str, detected_tools: list[str]) -> dict:
    client = grok_client or _grok_async_client()
    if client is None:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY is missing. Set it in backend/.env or your environment. Get a free key at https://console.groq.com",
        )

    user_message = (
        f"Project description: {user_input}\n"
        f"Detected tools/files: {', '.join(detected_tools)}"
    )

    async def _call(extra_user_suffix: str = "") -> str:
        user_content = user_message + extra_user_suffix
        resp = await client.chat.completions.create(
            model=GROK_MODEL,
            temperature=0,
            messages=[
                {"role": "system", "content": RESOLVE_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
        )
        return (resp.choices[0].message.content or "").strip()

    content = await _call()
    raw_json = _extract_json_object(content) or content

    try:
        data = json.loads(raw_json)
        if isinstance(data, dict) and "stack_name" in data and "required_tools" in data:
            return data
    except json.JSONDecodeError:
        pass

    retry_suffix = '\n\nRespond with ONLY raw JSON, absolutely nothing else.'
    content2 = await _call(retry_suffix)
    raw_json2 = _extract_json_object(content2) or content2

    try:
        data2 = json.loads(raw_json2)
        if isinstance(data2, dict) and "stack_name" in data2 and "required_tools" in data2:
            return data2
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Grok returned invalid JSON after retry: {e}",
        ) from e

    raise HTTPException(
        status_code=502,
        detail="Grok response did not match expected JSON schema (stack_name, required_tools).",
    )


def analyze_project(user_description: str, scan_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    client = _grok_sync_client()
    if client is None:
        return {
            "error": "GROQ_API_KEY is missing. Set it in backend/.env or your environment. Get a free key at https://console.groq.com",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable because GROQ_API_KEY is not configured.",
            "critical_issues": ["Missing GROQ_API_KEY"],
            "recommendations": [
                "Create backend/.env with GROQ_API_KEY=gsk_... and restart the server."
            ],
        }

    model = str(get_config_value("grok.model", GROQ_MODEL) or GROQ_MODEL)

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
            "error": f"Grok call failed: {e}",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable due to a Grok error.",
            "critical_issues": ["Grok request failed"],
            "recommendations": ["Verify network access and GROK_API_KEY, then retry."],
        }


async def analyze_project_async(user_description: str, scan_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    client = grok_client or _grok_async_client()
    if client is None:
        return {
            "error": "GROQ_API_KEY is missing. Set it in backend/.env or your environment. Get a free key at https://console.groq.com",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable because GROQ_API_KEY is not configured.",
            "critical_issues": ["Missing GROQ_API_KEY"],
            "recommendations": [
                "Create backend/.env with GROQ_API_KEY=gsk_... and restart the server."
            ],
        }

    model = str(get_config_value("grok.model", GROQ_MODEL) or GROQ_MODEL)

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
        resp = await client.chat.completions.create(
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
            "error": f"Grok call failed: {e}",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable due to a Grok error.",
            "critical_issues": ["Grok request failed"],
            "recommendations": ["Verify network access and GROK_API_KEY, then retry."],
        }

def get_install_command(tool_name: str, platform: str) -> Dict[str, Any]:
    client = _grok_sync_client()
    if client is None:
        return {
            "tool": tool_name,
            "platform": platform,
            "command": "",
            "notes": "GROQ_API_KEY is missing. Set it in backend/.env or your environment.",
            "error": "Missing GROQ_API_KEY",
        }

    model = str(get_config_value("grok.model", GROQ_MODEL) or GROQ_MODEL)
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
            "notes": "Grok request failed.",
            "error": str(e),
        }
