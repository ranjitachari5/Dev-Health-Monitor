from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class ToolHealth(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tool_name: str
    is_installed: bool
    current_version: Optional[str] = Field(default=None)
    required_version: str
    status: str  # "Healthy" | "Warning" | "Critical"


class ScanLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    overall_score: int