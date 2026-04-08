from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from datetime import datetime
from pydantic import BaseModel

from database import create_db_and_tables, get_session
from models import ToolHealth, ScanLog
from core.scanner import run_full_scan, compute_overall_score
from core.auto_fixer import trigger_fix
from core.config_parser import get_server_config
from core.project_builder import ProjectBootstrapper

app = FastAPI(
    title="Dev Environment Health Monitor",
    version="1.0.0",
)

server_config = get_server_config()
allowed_origins = server_config.get("allowed_origins", ["http://localhost:5173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton bootstrapper instance
_bootstrapper = ProjectBootstrapper()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class TestEnvRequest(BaseModel):
    stack: str


class BuildStackRequest(BaseModel):
    stack: str
    project_name: str = "my-project"


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# ---------------------------------------------------------------------------
# Existing endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", summary="Scan developer tools and return health status")
def get_health(session: Session = Depends(get_session)):
    scan_results = run_full_scan()
    overall_score = compute_overall_score(scan_results)

    # Persist scan log
    log = ScanLog(timestamp=datetime.utcnow(), overall_score=overall_score)
    session.add(log)

    # Upsert each tool result
    tool_health_records = []
    for result in scan_results:
        record = ToolHealth(**result)
        session.add(record)
        tool_health_records.append(result)

    session.commit()

    return {
        "scan_timestamp": log.timestamp,
        "overall_score": overall_score,
        "tools": tool_health_records,
    }


@app.post("/api/fix/{tool_name}", summary="Trigger a PowerShell fix for a given tool")
def fix_tool(
    tool_name: str,
    fix_type: str = Query(..., pattern="^(install|path)$", description="'install' or 'path'"),
):
    result = trigger_fix(tool_name=tool_name, fix_type=fix_type)

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Fix scripts failed for '{tool_name}' with fix_type='{fix_type}'.",
                "stderr": result["stderr"],
            },
        )

    return {
        "message": f"Fix applied successfully for '{tool_name}' (type: {fix_type}).",
        "terminal_output": result["stdout"],
    }


# ---------------------------------------------------------------------------
# NEW: Smart Project Bootstrapper endpoints
# ---------------------------------------------------------------------------

@app.post(
    "/api/test-env",
    summary="Test whether the environment satisfies prerequisites for a stack",
)
def test_env(payload: TestEnvRequest):
    """
    Accepts: {"stack": "react_vite"}
    Returns an environment readiness report — no subprocess is spawned.
    """
    result = _bootstrapper.test_stack_env(payload.stack)
    if "error" in result and not result.get("checks"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post(
    "/api/build-stack",
    summary="Bootstrap a new project by running the stack's scaffold command",
)
async def build_stack(payload: BuildStackRequest):
    """
    Accepts: {"stack": "react_vite", "project_name": "my-app"}
    Runs the bootstrap command asynchronously and returns stdout/stderr.
    A 500 is raised only on catastrophic failures; a failed command still
    returns 200 with success=False so the UI can surface the logs.
    """
    result = await _bootstrapper.bootstrap_stack(payload.stack, payload.project_name)
    if "error" in result and result.get("returncode") == -1 and not result.get("command_run"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result


if __name__ == "__main__":
    import uvicorn
    # Defaults to port 8000 but can be changed here
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
