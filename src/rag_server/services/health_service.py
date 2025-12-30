from typing import Any
from ..constants import APP_VERSION
from ..core.db import test_connection, init_db

async def health_check() -> dict:
    """Basic health check for the service, includes DB connectivity."""
    db_ok = await test_connection()
    status = "ok" if db_ok else "unavailable"
    return {"status": status, "version": APP_VERSION}

def echo_message(payload: dict) -> dict:
    """Simple echo endpoint used for smoke tests and examples."""
    return {"echoed": payload.get("message", ""), "version": APP_VERSION}

async def initialize_database() -> dict:
    """Initialize or recreate DB tables (runs init_db)."""
    await init_db()
    return {"status": "initialized"}

async def database_status() -> dict:
    """Return a quick DB connectivity/status check."""
    ok = await test_connection()
    return {"db_ok": ok}
