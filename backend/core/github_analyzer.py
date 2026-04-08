from __future__ import annotations

import base64
import re
from typing import Any, Dict, List, Set
from urllib.parse import urlparse

import httpx

USER_AGENT = "DevHealthMonitor/1.0"
GITHUB_API = "https://api.github.com"


def _parse_owner_repo(repo_url: str) -> tuple[str, str]:
    u = (repo_url or "").strip()
    m = re.match(
        r"^https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$",
        u,
        re.IGNORECASE,
    )
    if m:
        return m.group(1), m.group(2).rstrip("/")

    parsed = urlparse(u)
    if parsed.netloc.lower() in {"github.com", "www.github.com"}:
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2:
            owner, repo = parts[0], parts[1]
            if repo.endswith(".git"):
                repo = repo[:-4]
            return owner, repo

    raise ValueError("Invalid GitHub repository URL")


def _basename(path: str) -> str:
    return path.rsplit("/", 1)[-1] if path else path


async def _fetch_json(client: httpx.AsyncClient, url: str) -> Any:
    r = await client.get(url, headers={"User-Agent": USER_AGENT, "Accept": "application/vnd.github+json"})
    if r.status_code == 404:
        raise ValueError("Repository not found or is private")
    r.raise_for_status()
    return r.json()


async def _fetch_requirements_text(client: httpx.AsyncClient, owner: str, repo: str) -> str:
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/requirements.txt"
    try:
        r = await client.get(url, headers={"User-Agent": USER_AGENT, "Accept": "application/vnd.github+json"})
        if r.status_code != 200:
            return ""
        data = r.json()
        if isinstance(data, dict) and data.get("encoding") == "base64" and data.get("content"):
            raw = base64.b64decode(data["content"].replace("\n", "")).decode("utf-8", errors="replace")
            return raw.lower()
    except Exception:
        return ""
    return ""


def _apply_path_rules(paths: List[str], detected: Set[str]) -> None:
    basenames = {_basename(p) for p in paths}
    path_set = set(paths)

    if "package.json" in basenames:
        detected.update(["Node.js", "npm"])
    if "yarn.lock" in basenames:
        detected.discard("npm")
        detected.add("Yarn")
    if "pnpm-lock.yaml" in basenames:
        detected.add("pnpm")
    if "requirements.txt" in basenames:
        detected.update(["Python", "pip"])
    if "pyproject.toml" in basenames:
        detected.update(["Python", "pip"])
    if "go.mod" in basenames:
        detected.add("Go")
    if "pom.xml" in basenames:
        detected.update(["Java", "Maven"])
    if "build.gradle" in basenames or "build.gradle.kts" in basenames:
        detected.update(["Java", "Gradle"])
    if "Cargo.toml" in basenames:
        detected.update(["Rust", "Cargo"])
    if "composer.json" in basenames:
        detected.update(["PHP", "Composer"])
    if "Gemfile" in basenames:
        detected.update(["Ruby", "Bundler"])
    if "pubspec.yaml" in basenames:
        detected.update(["Flutter", "Dart"])
    if "Dockerfile" in basenames:
        detected.add("Docker")
    if "docker-compose.yml" in basenames or "docker-compose.yaml" in basenames:
        detected.add("Docker Compose")
    if ".nvmrc" in basenames:
        detected.add("Node.js")

    for p in paths:
        bn = _basename(p)
        if bn.startswith("next.config."):
            detected.add("Next.js")
        if bn.startswith("vite.config."):
            detected.add("Vite")
        if bn == "angular.json":
            detected.add("Angular")
        if bn.startswith("nuxt.config."):
            detected.add("Nuxt.js")
        if bn == "manage.py":
            detected.add("Django")


async def analyze_github_repo(repo_url: str) -> dict:
    owner, repo = _parse_owner_repo(repo_url)

    tree_url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"

    async with httpx.AsyncClient(timeout=30.0) as client:
        tree_data = await _fetch_json(client, tree_url)
        if not isinstance(tree_data, dict) or tree_data.get("truncated"):
            pass

        items = tree_data.get("tree") or []
        paths: List[str] = []
        if isinstance(items, list):
            for it in items:
                if isinstance(it, dict) and it.get("type") == "blob" and it.get("path"):
                    paths.append(str(it["path"]))

        detected: Set[str] = set()
        _apply_path_rules(paths, detected)

        req_lower = ""
        if "requirements.txt" in {_basename(p) for p in paths}:
            req_lower = await _fetch_requirements_text(client, owner, repo)
            if "fastapi" in req_lower:
                detected.add("FastAPI")
            if "uvicorn" in req_lower:
                detected.add("uvicorn")

        detected_list = sorted(detected)
        hint_parts = detected_list[:8]
        stack_hint = ", ".join(hint_parts) if hint_parts else "Unknown stack"

        return {
            "detected_tools": detected_list,
            "stack_hint": stack_hint,
        }
