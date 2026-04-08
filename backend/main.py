from __future__ import annotations

import json
import os as os_module
import platform as platform_module
from datetime import datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

load_dotenv()

from database import create_db_and_tables, get_session
from models import ProjectConfig, ScanLog, StackScanRecord, ToolHealth
from core.ai_advisor import analyze_project, get_install_command, resolve_dependencies
from core.auto_fixer import detect_platform as detect_fix_platform
from core.auto_fixer import trigger_fix
from core.config_parser import get_config_value
from core.github_analyzer import analyze_github_repo
from core.scanner import detect_platform as detect_scan_platform
from core.scanner import scan_all_tools, scan_environment

app = FastAPI(title="Dev Environment Health Monitor")

_cors_cfg = get_config_value("api.cors_origins", []) or []
_cors_base = ["http://localhost:5173", "http://localhost:3000"]
cors_origins = list(dict.fromkeys(_cors_base + (list(_cors_cfg) if isinstance(_cors_cfg, list) else [])))
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
            "scan": "/api/scan",
            "analyze": "/api/analyze",
            "analyze_github": "/api/analyze-github",
            "history_dynamic": "/api/history",
            "scan_by_id": "/api/scan/{scan_id}",
            "fix": "/api/fix/{tool_name}?fix_type=install|path|update",
            "history": "/api/scan/history",
            "install_command": "/api/install-command/{tool_name}",
        },
    }


@app.get("/api/ping")
def ping() -> Dict[str, str]:
    return {"status": "ok"}


class ScanRequest(BaseModel):
    user_input: str
    detected_tools: List[str] = []


class GithubRequest(BaseModel):
    repo_url: str


@app.post("/api/scan")
async def api_scan(req: ScanRequest, session: Session = Depends(get_session)) -> Dict[str, Any]:
    try:
        resolved = await resolve_dependencies(req.user_input, req.detected_tools)
        stack_name = str(resolved.get("stack_name") or "Unknown")
        raw_tools = resolved.get("required_tools") or []
        if not isinstance(raw_tools, list):
            raw_tools = []

        normalized_tools: List[Dict[str, Any]] = []
        for item in raw_tools:
            if not isinstance(item, dict):
                continue
            normalized_tools.append(item)

        results = await scan_environment(normalized_tools)

        summary = {"total": len(results), "ok": 0, "outdated": 0, "missing": 0}
        for row in results:
            st = row.get("status", "missing")
            if st == "ok":
                summary["ok"] += 1
            elif st == "outdated":
                summary["outdated"] += 1
            else:
                summary["missing"] += 1

        user_input_summary = (req.user_input or "")[:200]

        record = StackScanRecord(
            stack_name=stack_name,
            user_input_summary=user_input_summary,
            results_json=json.dumps(results),
            summary_json=json.dumps(summary),
        )
        session.add(record)
        session.commit()
        session.refresh(record)

        ts = record.timestamp.isoformat() if record.timestamp else ""
        if ts.endswith("+00:00"):
            ts = ts.replace("+00:00", "Z")

        return {
            "scan_id": record.id,
            "stack_name": stack_name,
            "results": results,
            "summary": summary,
            "environment": {
                "os_name": os_module.name,
                "system": platform_module.system(),
                "platform": platform_module.platform(),
            },
            "timestamp": ts,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/analyze-github")
async def api_analyze_github(req: GithubRequest) -> Dict[str, Any]:
    try:
        return await analyze_github_repo(req.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.get("/api/history")
def api_dynamic_history(session: Session = Depends(get_session)) -> List[Dict[str, Any]]:
    rows = session.exec(select(StackScanRecord).order_by(StackScanRecord.timestamp.desc()).limit(20)).all()
    out: List[Dict[str, Any]] = []
    for r in rows:
        try:
            summ = json.loads(r.summary_json) if r.summary_json else {}
        except json.JSONDecodeError:
            summ = {}
        ts = r.timestamp.isoformat() if r.timestamp else ""
        if ts.endswith("+00:00"):
            ts = ts.replace("+00:00", "Z")
        out.append(
            {
                "scan_id": r.id,
                "timestamp": ts,
                "stack_name": r.stack_name,
                "user_input_summary": r.user_input_summary,
                "summary": summ,
            }
        )
    return out


@app.get("/api/scan/{scan_id}")
def api_get_scan(scan_id: int, session: Session = Depends(get_session)) -> Dict[str, Any]:
    record = session.get(StackScanRecord, scan_id)
    if not record:
        raise HTTPException(status_code=404, detail="Scan not found")
    try:
        results = json.loads(record.results_json) if record.results_json else []
    except json.JSONDecodeError:
        results = []
    try:
        summary = json.loads(record.summary_json) if record.summary_json else {}
    except json.JSONDecodeError:
        summary = {}
    ts = record.timestamp.isoformat() if record.timestamp else ""
    if ts.endswith("+00:00"):
        ts = ts.replace("+00:00", "Z")
    return {
        "scan_id": record.id,
        "stack_name": record.stack_name,
        "results": results,
        "summary": summary,
        "timestamp": ts,
    }


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


class ToolInfo(BaseModel):
    tool_name: str
    is_installed: bool
    current_version: Optional[str] = None
    required_version: Optional[str] = None
    status: str
    platform: str


class HealthResponse(BaseModel):
    scan_id: int
    platform: str
    overall_score: int
    tools: List[ToolInfo]
    timestamp: datetime


class AIAnalysis(BaseModel):
    required_tools: List[str] = []
    missing_tools: List[str] = []
    outdated_tools: List[str] = []
    health_summary: str = ""
    critical_issues: List[str] = []
    recommendations: List[str] = []
    version_requirements: Dict[str, str] = {}
    error: Optional[str] = None


class AnalyzeResponse(BaseModel):
    scan_results: List[ToolInfo]
    ai_analysis: AIAnalysis
    overall_score: int
    scan_id: int
    platform: str
    timestamp: datetime


class TerminalOutput(BaseModel):
    stdout: str
    stderr: str


class FixResponse(BaseModel):
    success: bool
    message: str
    terminal_output: TerminalOutput
    tool_name: str
    fix_type: str
    command_executed: str


class ScanHistoryEntry(BaseModel):
    id: int
    timestamp: datetime
    overall_score: int
    platform: str
    project_description: Optional[str] = None
    ai_summary: Optional[str] = None
    tools: List[ToolInfo]


class ScanHistoryResponse(BaseModel):
    history: List[ScanHistoryEntry]


class InstallCommandResponse(BaseModel):
    tool: str
    platform: str
    command: str
    notes: str
    error: Optional[str] = None
    raw_response: Optional[str] = None


@app.get("/api/health", response_model=HealthResponse)
def get_health(session: Session = Depends(get_session)) -> HealthResponse:
    platform_name = detect_scan_platform()
    tools = scan_all_tools()
    scan = _persist_scan(session, platform_name=platform_name, tools=tools)
    return HealthResponse(
        scan_id=scan.id,
        platform=platform_name,
        overall_score=scan.overall_score,
        tools=[ToolInfo(**t) for t in tools],
        timestamp=scan.timestamp,
    )


@app.post("/api/analyze", response_model=AnalyzeResponse)
def post_analyze(body: AnalyzeBody, session: Session = Depends(get_session)) -> AnalyzeResponse:
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

    response = AnalyzeResponse(
        scan_results=[ToolInfo(**t) for t in scan_results],
        ai_analysis=AIAnalysis(
            required_tools=ai.get("required_tools", []),
            missing_tools=ai.get("missing_tools", []),
            outdated_tools=ai.get("outdated_tools", []),
            health_summary=ai.get("health_summary", ""),
            critical_issues=ai.get("critical_issues", []),
            recommendations=ai.get("recommendations", []),
            version_requirements=ai.get("version_requirements", {}),
            error=ai.get("error"),
        ),
        overall_score=scan.overall_score,
        scan_id=scan.id,
        platform=platform_name,
        timestamp=scan.timestamp,
    )
    return response


@app.post("/api/fix/{tool_name}", response_model=FixResponse)
def post_fix(
    tool_name: str,
    fix_type: str = Query(..., pattern="^(install|path|update)$"),
) -> FixResponse:
    platform_name = detect_fix_platform()
    res = trigger_fix(tool_name=tool_name, fix_type=fix_type, platform=platform_name)
    terminal_output = TerminalOutput(stdout=res.get("stdout", ""), stderr=res.get("stderr", ""))
    if not res.get("success"):
        return FixResponse(
            success=False,
            message=f"Fix failed for {tool_name} ({fix_type}).",
            terminal_output=terminal_output,
            tool_name=tool_name,
            fix_type=fix_type,
            command_executed=res.get("command_executed", ""),
        )
    return FixResponse(
        success=True,
        message=f"Fix executed for {tool_name} ({fix_type}).",
        terminal_output=terminal_output,
        tool_name=tool_name,
        fix_type=fix_type,
        command_executed=res.get("command_executed", ""),
    )


@app.get("/api/scan/history", response_model=ScanHistoryResponse)
def get_scan_history(session: Session = Depends(get_session)) -> ScanHistoryResponse:
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
            ScanHistoryEntry(
                id=s.id,
                timestamp=s.timestamp,
                overall_score=s.overall_score,
                platform=s.platform,
                project_description=s.project_description,
                ai_summary=s.ai_summary,
                tools=[
                    ToolInfo(
                        tool_name=t.tool_name,
                        is_installed=t.is_installed,
                        current_version=t.current_version,
                        required_version=t.required_version,
                        status=t.status,
                        platform=t.platform,
                    )
                    for t in sorted(s_tools, key=lambda x: x.tool_name)
                ],
            )
        )
    return ScanHistoryResponse(history=payload)


@app.get("/api/install-command/{tool_name}", response_model=InstallCommandResponse)
def get_install_cmd(tool_name: str) -> InstallCommandResponse:
    platform_name = detect_scan_platform()
    res = get_install_command(tool_name=tool_name, platform=platform_name)
    return InstallCommandResponse(
        tool=str(res.get("tool", tool_name)),
        platform=str(res.get("platform", platform_name)),
        command=str(res.get("command", "")),
        notes=str(res.get("notes", "")),
        error=res.get("error"),
        raw_response=res.get("raw_response"),
    )

