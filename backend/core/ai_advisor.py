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


# ---------------------------------------------------------------------------
# Provider detection helpers
# ---------------------------------------------------------------------------

def detect_provider_from_key(api_key: str) -> Dict[str, str]:
    """
    Auto-detect the AI provider from the API key prefix and return
    sensible defaults (base_url, model).
    Supports: OpenAI, Groq, Anthropic, Google Gemini, DeepSeek, and custom.
    """
    key = (api_key or "").strip()

    # Anthropic: sk-ant-...
    if key.startswith("sk-ant-"):
        return {
            "provider": "anthropic",
            "base_url": "https://api.anthropic.com/v1",
            "model": "claude-3-5-sonnet-20241022",
        }

    # OpenRouter: sk-or-... (must be checked BEFORE generic sk-)
    if key.startswith("sk-or-"):
        return {
            "provider": "openrouter",
            "base_url": "https://openrouter.ai/api/v1",
            "model": "openai/gpt-4o-mini",
        }

    # Google Gemini: AIza...
    if key.startswith("AIza"):
        return {
            "provider": "gemini",
            "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
            "model": "gemini-2.0-flash",
        }

    # Groq: gsk_...
    if key.startswith("gsk_"):
        return {
            "provider": "groq",
            "base_url": "https://api.groq.com/openai/v1",
            "model": "llama-3.3-70b-versatile",
        }

    # OpenAI: sk-proj-... or sk-...
    if key.startswith("sk-"):
        return {
            "provider": "openai",
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4o-mini",
        }

    # Unknown — return empty, caller falls back to config
    return {}


def _get_ai_config(
    dynamic_key: Optional[str] = None,
    dynamic_base_url: Optional[str] = None,
    dynamic_model: Optional[str] = None,
) -> Dict[str, str]:
    """
    Build the final AI config by merging dynamic (per-request) values with
    the static config.json / .env defaults.

    Priority: dynamic > config.json > sensible default
    """
    # --- Static config.json defaults ---
    cfg_provider = str(get_config_value("ai.provider", "openai") or "openai")
    cfg_base_url = str(get_config_value("ai.base_url", "https://api.openai.com/v1") or "https://api.openai.com/v1")
    cfg_model = str(get_config_value("ai.model", "gpt-4o-mini") or "gpt-4o-mini")
    cfg_key_env = str(get_config_value("ai.api_key_env_var", "AI_API_KEY") or "AI_API_KEY")
    env_api_key = os.getenv(cfg_key_env) or ""

    # --- Resolve the final API key ---
    final_key = (dynamic_key or "").strip() or env_api_key

    # --- If a dynamic key is provided, auto-detect provider ---
    dynamic_detected: Dict[str, str] = {}
    if (dynamic_key or "").strip():
        dynamic_detected = detect_provider_from_key(dynamic_key.strip())

    # --- Merge priority ---
    final_provider = dynamic_detected.get("provider") or cfg_provider
    # base_url: explicit override > auto-detected > config
    final_base_url = (
        (dynamic_base_url or "").strip()
        or dynamic_detected.get("base_url", "")
        or cfg_base_url
    )
    # model: explicit override > auto-detected > config
    final_model = (
        (dynamic_model or "").strip()
        or dynamic_detected.get("model", "")
        or cfg_model
    )

    return {
        "provider": final_provider,
        "base_url": final_base_url,
        "model": final_model,
        "api_key": final_key,
        "api_key_env_var": cfg_key_env,
    }


# ---------------------------------------------------------------------------
# Client factories
# ---------------------------------------------------------------------------

def _ai_sync_client(
    dynamic_key: Optional[str] = None,
    dynamic_base_url: Optional[str] = None,
    dynamic_model: Optional[str] = None,
) -> Optional[OpenAI]:
    config = _get_ai_config(dynamic_key, dynamic_base_url, dynamic_model)
    if not config["api_key"]:
        return None
    return OpenAI(api_key=config["api_key"], base_url=config["base_url"])


def _ai_async_client(
    dynamic_key: Optional[str] = None,
    dynamic_base_url: Optional[str] = None,
    dynamic_model: Optional[str] = None,
) -> Optional[AsyncOpenAI]:
    config = _get_ai_config(dynamic_key, dynamic_base_url, dynamic_model)
    if not config["api_key"]:
        return None
    return AsyncOpenAI(api_key=config["api_key"], base_url=config["base_url"])


# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------

def _extract_json_object(text: str) -> Optional[str]:
    if not text:
        return None
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        return text
    m = re.search(r"\{[\s\S]*\}", text)
    return m.group(0) if m else None


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Public AI functions
# ---------------------------------------------------------------------------

async def resolve_dependencies(
    user_input: str,
    detected_tools: list[str],
    dynamic_key: Optional[str] = None,
    dynamic_base_url: Optional[str] = None,
    dynamic_model: Optional[str] = None,
) -> dict:
    config = _get_ai_config(dynamic_key, dynamic_base_url, dynamic_model)
    client = _ai_async_client(dynamic_key, dynamic_base_url, dynamic_model)
    if client is None:
        raise HTTPException(
            status_code=400,
            detail=f"No AI API key configured. Set {config['api_key_env_var']} in backend/.env or enter your key in the app settings.",
        )

    user_message = (
        f"Project description: {user_input}\n"
        f"Detected tools/files: {', '.join(detected_tools)}"
    )

    async def _call(extra_user_suffix: str = "") -> str:
        user_content = user_message + extra_user_suffix
        try:
            resp = await client.chat.completions.create(
                model=config["model"],
                temperature=0,
                messages=[
                    {"role": "system", "content": RESOLVE_SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception as e:
            err_msg = str(e)
            if "AuthenticationError" in repr(e) or "401" in str(e):
                err_msg = "Invalid AI API Key. Please check your key in settings."
            elif "RateLimitError" in repr(e) or "429" in str(e):
                err_msg = "AI Rate limit exceeded. Please try again later or check your billing account."
            raise HTTPException(status_code=400, detail=f"AI API Error: {err_msg}") from e

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
            detail=f"AI returned invalid JSON after retry: {e}",
        ) from e

    raise HTTPException(
        status_code=502,
        detail="AI response did not match expected JSON schema (stack_name, required_tools).",
    )


def analyze_project(
    user_description: str,
    scan_results: List[Dict[str, Any]],
    dynamic_key: Optional[str] = None,
    dynamic_base_url: Optional[str] = None,
    dynamic_model: Optional[str] = None,
) -> Dict[str, Any]:
    config = _get_ai_config(dynamic_key, dynamic_base_url, dynamic_model)
    client = _ai_sync_client(dynamic_key, dynamic_base_url, dynamic_model)
    if client is None:
        return {
            "error": f"No AI API key. Set {config['api_key_env_var']} in backend/.env or enter your key in the app settings.",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable because no API key is configured.",
            "critical_issues": [f"Missing API key ({config['api_key_env_var']})"],
            "recommendations": [
                f"Create backend/.env with {config['api_key_env_var']}=your_key and restart the server, "
                "or click the ⚙ Settings button in the app and enter your key."
            ],
        }

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
            model=config["model"],
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
            "error": f"AI call failed: {e}",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable due to an AI error.",
            "critical_issues": ["AI request failed"],
            "recommendations": ["Verify your API key is valid and you have network access, then retry."],
        }


async def analyze_project_async(
    user_description: str,
    scan_results: List[Dict[str, Any]],
    dynamic_key: Optional[str] = None,
    dynamic_base_url: Optional[str] = None,
    dynamic_model: Optional[str] = None,
) -> Dict[str, Any]:
    config = _get_ai_config(dynamic_key, dynamic_base_url, dynamic_model)
    client = _ai_async_client(dynamic_key, dynamic_base_url, dynamic_model)
    if client is None:
        return {
            "error": f"No AI API key. Set {config['api_key_env_var']} in backend/.env or enter your key in the app settings.",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable because no API key is configured.",
            "critical_issues": [f"Missing API key ({config['api_key_env_var']})"],
            "recommendations": [
                f"Create backend/.env with {config['api_key_env_var']}=your_key and restart the server, "
                "or click the ⚙ Settings button in the app and enter your key."
            ],
        }

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
            model=config["model"],
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
            "error": f"AI call failed: {e}",
            "required_tools": [],
            "version_requirements": {},
            "missing_tools": [],
            "outdated_tools": [],
            "health_summary": "AI analysis unavailable due to an AI error.",
            "critical_issues": ["AI request failed"],
            "recommendations": ["Verify your API key is valid and you have network access, then retry."],
        }


def get_install_command(
    tool_name: str,
    platform: str,
    dynamic_key: Optional[str] = None,
    dynamic_base_url: Optional[str] = None,
    dynamic_model: Optional[str] = None,
) -> Dict[str, Any]:
    config = _get_ai_config(dynamic_key, dynamic_base_url, dynamic_model)
    client = _ai_sync_client(dynamic_key, dynamic_base_url, dynamic_model)
    if client is None:
        return {
            "tool": tool_name,
            "platform": platform,
            "command": "",
            "notes": f"No API key configured. Set {config['api_key_env_var']} in backend/.env or enter your key in app settings.",
            "error": f"Missing API key",
        }

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
            model=config["model"],
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
            "notes": "AI request failed.",
            "error": str(e),
        }
