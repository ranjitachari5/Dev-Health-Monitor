from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from datetime import datetime

from database import create_db_and_tables, get_session
from models import ToolHealth, ScanLog
from core.scanner import run_full_scan, compute_overall_score
from core.auto_fixer import trigger_fix
from core.config_parser import get_server_config

app = FastAPI(
    title="Dev Environment Health Monitor",
    version="1.0.0",
)

server_config = get_server_config()
allowed_origins = server_config.get("allowed_origins", ["http://localhost:5173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


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
                "message": f"Fix script failed for '{tool_name}' with fix_type='{fix_type}'.",
                "stderr": result["stderr"],
            },
        )

    return {
        "message": f"Fix applied successfully for '{tool_name}' (type: {fix_type}).",
        "terminal_output": result["stdout"],
    }


if __name__ == "__main__":
    import uvicorn
    # Defaults to port 8000 but can be changed here
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)