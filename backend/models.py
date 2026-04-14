from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """Registered user account."""

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class ScanLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    overall_score: int = Field(default=0)
    platform: str = Field(index=True)
    project_description: Optional[str] = None
    ai_summary: Optional[str] = None


class ToolHealth(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tool_name: str = Field(index=True)
    is_installed: bool = Field(default=False, index=True)
    current_version: Optional[str] = None
    required_version: Optional[str] = None
    status: str = Field(default="Unknown", index=True)
    platform: str = Field(index=True)
    scan_id: Optional[int] = Field(default=None, foreign_key="scanlog.id", index=True)


class ProjectConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    description: str
    ai_response: str


class StackScanRecord(SQLModel, table=True):
    """Persists dynamic stack scans — linked to a specific user for data isolation."""

    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    stack_name: str = Field(default="")
    user_input_summary: str = Field(default="")
    results_json: str = Field(default="")
    summary_json: str = Field(default="")
    # FK to User — nullable so historical rows without a user remain valid
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
