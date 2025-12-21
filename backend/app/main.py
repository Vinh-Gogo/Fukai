"""
FastAPI backend for web crawling and file management
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import structlog

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router
from app.core.database import init_database, init_database_async
from app.core.middleware import ExceptionHandlerMiddleware, RequestLoggingMiddleware
from app.core.rate_limiting import limiter, rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware

# Setup structured logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Startup
    structlog.get_logger().info("Starting FastAPI application")
    init_database()
    await init_database_async()
    structlog.get_logger().info("Database initialized successfully")
    yield
    # Shutdown
    structlog.get_logger().info("Shutting down FastAPI application")

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI backend for web crawling and document management",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Set up trusted hosts
if settings.ALLOWED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )

# Add custom middleware
app.add_middleware(ExceptionHandlerMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Add rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

# Add rate limit exception handler
app.add_exception_handler(429, rate_limit_exceeded_handler)

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "fastapi-backend"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "FastAPI Backend for Web Crawling and Document Management"}
