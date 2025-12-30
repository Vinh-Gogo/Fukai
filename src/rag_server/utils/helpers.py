from datetime import datetime, timezone

def utc_now_iso() -> str:
    """Return current time in UTC as an ISO formatted string."""
    return datetime.now(timezone.utc).isoformat()
