"""
auth.py — JWT + bcrypt helpers for Dev Health Monitor.

NEVER import this from client-side code. All logic runs server-side only.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt

load_dotenv()

# ── Constants ──────────────────────────────────────────────────────────────
JWT_SECRET: str = os.getenv(
    "JWT_SECRET",
    "devhealth_change_this_secret_in_production",
)
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


# OAuth2 scheme — reads "Authorization: Bearer <token>" header automatically
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ── Password helpers ───────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


# ── JWT helpers ────────────────────────────────────────────────────────────

def create_access_token(email: str) -> str:
    """Return a signed JWT valid for TOKEN_EXPIRE_DAYS days."""
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    """Decode a JWT and return the email (sub) claim. Raises 401 on failure."""
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: Optional[str] = data.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return email
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# ── FastAPI dependency ─────────────────────────────────────────────────────

def get_current_user_email(
    token: Optional[str] = Depends(oauth2_scheme),
) -> str:
    """Dependency that requires a valid Bearer token. Returns the user's email."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return decode_token(token)
