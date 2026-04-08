from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from database import create_db_and_tables, get_session
from models import ProjectConfig, ScanLog, ToolHealth
from core.ai_advisor import analyze_project, get_install_command
from core.auto_fixer import detect_platform as detect_fix_platform
from core.auto_fixer import trigger_fix
from core.config_parser import get_config_value
from core.scanner import detect_platform as detect_scan_platform
from core.scanner import scan_all_tools


load_dotenv()

app = FastAPI(title="Dev Environment Health Monitor")

cors_origins = get_config_value("api.cors_origins", ["http://localhost:5173"]) or ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "service": "Dev Environment Health Monitor",
        "status": "ok",
        "docs": "/docs",
        "endpoints": {
            "health": "/api/health",
            "analyze": "/api/analyze",
            "fix": "/api/fix/{tool_name}?fix_type=install|path|update",
            "history": "/api/scan/history",
            "install_command": "/api/install-command/{tool_name}",
        },
    }


@app.get("/api/ping")
def ping() -> Dict[str, str]:
    return {"status": "ok"}


def _compute_overall_score(tools: List[Dict[str, Any]]) -> int:
    """
    Simple scoring: start at 100, subtract based on status and missing installs.
    Clamp to [0, 100].
    """
    score = 100
    for t in tools:
        status = (t.get("status") or "Unknown").lower()
        installed = bool(t.get("is_installed"))
        if not installed:
            score -= 5
        elif status == "warning":
            score -= 2
        elif status == "critical":
            score -= 5
        elif status == "unknown":
            score -= 1
    if score < 0:
        score = 0
    if score > 100:
        score = 100
    return int(score)


def _persist_scan(session: Session, platform_name: str, tools: List[Dict[str, Any]], project_description: Optional[str] = None, ai_summary: Optional[str] = None) -> ScanLog:
    scan = ScanLog(
        timestamp=datetime.utcnow(),
        overall_score=_compute_overall_score(tools),
        platform=platform_name,
        project_description=project_description,
        ai_summary=ai_summary,
    )
    session.add(scan)
    session.commit()
    session.refresh(scan)

    for t in tools:
        session.add(
            ToolHealth(
                tool_name=str(t.get("tool_name")),
                is_installed=bool(t.get("is_installed")),
                current_version=t.get("current_version"),
                required_version=t.get("required_version"),
                status=str(t.get("status") or "Unknown"),
                platform=str(t.get("platform") or platform_name),
                scan_id=scan.id,
            )
        )
    session.commit()
    return scan


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


class AnalyzeBody(BaseModel):
    project_description: str


@app.get("/api/health")
def get_health(session: Session = Depends(get_session)) -> Dict[str, Any]:
    platform_name = detect_scan_platform()
    tools = scan_all_tools()
    scan = _persist_scan(session, platform_name=platform_name, tools=tools)
    return {
        "scan_id": scan.id,
        "platform": platform_name,
        "overall_score": scan.overall_score,
        "tools": tools,
        "timestamp": scan.timestamp,
    }


@app.post("/api/analyze")
def post_analyze(body: AnalyzeBody, session: Session = Depends(get_session)) -> Dict[str, Any]:
    platform_name = detect_scan_platform()
    scan_results = scan_all_tools()

    ai = analyze_project(body.project_description, scan_results)

    version_requirements = ai.get("version_requirements") or {}
    if isinstance(version_requirements, dict):
        for t in scan_results:
            name = t.get("tool_name")
            if name in version_requirements:
                t["required_version"] = str(version_requirements.get(name))

    ai_summary = ai.get("health_summary")
    if isinstance(ai_summary, str) and len(ai_summary) > 2000:
        ai_summary = ai_summary[:2000]

    scan = _persist_scan(
        session,
        platform_name=platform_name,
        tools=scan_results,
        project_description=body.project_description,
        ai_summary=ai_summary if isinstance(ai_summary, str) else None,
    )

    # Store raw AI JSON response
    session.add(ProjectConfig(description=body.project_description, ai_response=json.dumps(ai)))
    session.commit()

    return {
        "scan_results": scan_results,
        "ai_analysis": {
            "required_tools": ai.get("required_tools", []),
            "missing_tools": ai.get("missing_tools", []),
            "outdated_tools": ai.get("outdated_tools", []),
            "health_summary": ai.get("health_summary", ""),
            "critical_issues": ai.get("critical_issues", []),
            "recommendations": ai.get("recommendations", []),
            "version_requirements": ai.get("version_requirements", {}),
            "error": ai.get("error"),
        },
        "overall_score": scan.overall_score,
        "scan_id": scan.id,
        "platform": platform_name,
        "timestamp": scan.timestamp,
    }


@app.post("/api/fix/{tool_name}")
def post_fix(
    tool_name: str,
    fix_type: str = Query(..., pattern="^(install|path|update)$"),
) -> Dict[str, Any]:
    platform_name = detect_fix_platform()
    res = trigger_fix(tool_name=tool_name, fix_type=fix_type, platform=platform_name)
    if not res.get("success"):
        return {
            "success": False,
            "message": f"Fix failed for {tool_name} ({fix_type}).",
            "terminal_output": {"stdout": res.get("stdout", ""), "stderr": res.get("stderr", "")},
            "tool_name": tool_name,
            "fix_type": fix_type,
            "command_executed": res.get("command_executed", ""),
        }
    return {
        "success": True,
        "message": f"Fix executed for {tool_name} ({fix_type}).",
        "terminal_output": {"stdout": res.get("stdout", ""), "stderr": res.get("stderr", "")},
        "tool_name": tool_name,
        "fix_type": fix_type,
        "command_executed": res.get("command_executed", ""),
    }


@app.get("/api/scan/history")
def get_scan_history(session: Session = Depends(get_session)) -> Dict[str, Any]:
    scans = session.exec(select(ScanLog).order_by(ScanLog.timestamp.desc()).limit(10)).all()
    scan_ids = [s.id for s in scans if s.id is not None]

    tools_by_scan: Dict[int, List[ToolHealth]] = {}
    if scan_ids:
        tool_rows = session.exec(select(ToolHealth).where(ToolHealth.scan_id.in_(scan_ids))).all()
        for tr in tool_rows:
            if tr.scan_id is None:
                continue
            tools_by_scan.setdefault(tr.scan_id, []).append(tr)

    payload = []
    for s in scans:
        s_tools = tools_by_scan.get(s.id or -1, [])
        payload.append(
            {
                "id": s.id,
                "timestamp": s.timestamp,
                "overall_score": s.overall_score,
                "platform": s.platform,
                "project_description": s.project_description,
                "ai_summary": s.ai_summary,
                "tools": [
                    {
                        "tool_name": t.tool_name,
                        "is_installed": t.is_installed,
                        "current_version": t.current_version,
                        "required_version": t.required_version,
                        "status": t.status,
                        "platform": t.platform,
                    }
                    for t in sorted(s_tools, key=lambda x: x.tool_name)
                ],
            }
        )
    return {"history": payload}


@app.get("/api/install-command/{tool_name}")
def get_install_cmd(tool_name: str) -> Dict[str, Any]:
    platform_name = detect_scan_platform()
    res = get_install_command(tool_name=tool_name, platform=platform_name)
    return res

