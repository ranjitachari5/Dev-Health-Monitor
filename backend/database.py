from __future__ import annotations

import json
from pathlib import Path
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine


def _load_database_url() -> str:
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


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

