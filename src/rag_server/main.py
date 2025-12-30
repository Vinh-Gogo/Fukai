from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator
import os
import sys

# Add src directory to Python path for consistent imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import modules with absolute paths
from rag_server.constants import APP_NAME, APP_VERSION, API_PREFIX
from rag_server.api.v1.routes import router as v1_router
from rag_server.observability.logging import setup_logging
from rag_server.observability.middleware import (
    RequestLoggingMiddleware,
    AuthenticationMiddleware,
    ErrorHandlingMiddleware,
    RateLimitingMiddleware,
    RequestValidationMiddleware,
    create_cors_middleware,
    create_trusted_host_middleware
)
from rag_server.utils.helpers import utc_now_iso

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown events."""
    # Startup
    try:
        from rag_server.core.db import init_db
        await init_db()
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")

    app.state.started_at = utc_now_iso()
    yield
    # Shutdown - placeholder for cleanup logic
    pass

def create_app() -> FastAPI:
    setup_logging()

    # Create FastAPI app with modern lifespan handler
    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        lifespan=lifespan,
        middleware=[
            # Starlette middlewares with options
            (CORSMiddleware, {
                 "allow_origins": ["*"],
                 "allow_credentials": True,
                 "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["*"],
             }),
            (TrustedHostMiddleware, {"allowed_hosts": ["*"]}),
            # Custom middlewares (no options needed)
            (RequestValidationMiddleware, {}),
            (RateLimitingMiddleware, {}),
            (AuthenticationMiddleware, {}),
            (RequestLoggingMiddleware, {}),
            (ErrorHandlingMiddleware, {}),
        ]
    )

    app.include_router(v1_router, prefix=API_PREFIX)

    @app.get("/", include_in_schema=False)
    def root() -> Any:
        return {"status": "ok", "started_at": app.state.started_at}

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_server.main:app", host="127.0.0.1", port=8000, reload=True)
