from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

load_dotenv()


def _load_database_url() -> str:
    env_url = (os.getenv("DATABASE_URL") or "").strip()
    if env_url:
        return env_url
    config_path = Path(__file__).resolve().parent / "config.json"
    try:
        data = json.loads(config_path.read_text(encoding="utf-8"))
        url = str(data.get("database_url") or "").strip()
        if url:
            return url
    except Exception:
        pass
    return "sqlite:///./dev_env_health.db"


DATABASE_URL = _load_database_url()

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _run_lightweight_migrations()


def _run_lightweight_migrations() -> None:
    """Small additive migrations for local SQLite without Alembic."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    with engine.begin() as conn:
        cols = conn.execute(text("PRAGMA table_info('stackscanrecord')")).fetchall()
        names = {str(c[1]).lower() for c in cols}
        if "client_id" not in names:
            conn.execute(
                text("ALTER TABLE stackscanrecord ADD COLUMN client_id TEXT DEFAULT 'anonymous'")
            )


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

