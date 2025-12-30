import logging
import sys
from typing import Optional

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

def setup_logging(level: int = logging.INFO, fmt: Optional[str] = LOG_FORMAT) -> None:
    """Configure basic logging for the application."""
    root = logging.getLogger()
    if root.handlers:
        # Avoid configuring logging multiple times in tests / reloads
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt))
    root.setLevel(level)
    root.addHandler(handler)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
