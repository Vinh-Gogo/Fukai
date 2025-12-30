from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from ...services.health_service import health_check, echo_message, initialize_database, database_status
from .dtos import HealthResponseDTO, SuccessResponseDTO, BaseDTO

router = APIRouter()

class EchoRequestDTO(BaseDTO):
    """DTO for echo request payload."""
    message: str = Field(..., description="Message to echo back", example="Hello, World!")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data to include")

class EchoResponseDTO(SuccessResponseDTO):
    """DTO for echo response."""
    echoed_message: str = Field(description="The echoed message")
    original_data: Optional[Dict[str, Any]] = Field(None, description="Original data sent")

@router.get("/health", response_model=HealthResponseDTO, summary="Health Check", description="Basic health check for the service, includes DB connectivity")
async def health():
    """Basic health check for the service, includes DB connectivity."""
    health_data = await health_check()
    return HealthResponseDTO(
        status=health_data.get("status", "unknown"),
        timestamp=health_data.get("timestamp"),
        version=health_data.get("version", "1.0.0"),
        uptime_seconds=health_data.get("uptime_seconds")
    )

@router.post("/echo", response_model=EchoResponseDTO, summary="Echo Message", description="Simple echo endpoint used for smoke tests and examples")
async def echo(payload: EchoRequestDTO):
    """Simple echo endpoint used for smoke tests and examples."""
    result = echo_message(payload.dict())
    return EchoResponseDTO(
        message="Message echoed successfully",
        echoed_message=payload.message,
        original_data=payload.data
    )

@router.post("/db/init", response_model=SuccessResponseDTO, summary="Initialize Database", description="Initialize or recreate DB tables")
async def init_db_endpoint():
    """Initialize or recreate DB tables (runs init_db)."""
    result = await initialize_database()
    if result.get("success"):
        return SuccessResponseDTO(message="Database initialized successfully")
    else:
        raise HTTPException(status_code=500, detail=result.get("message", "Database initialization failed"))

@router.get("/db/status", response_model=SuccessResponseDTO, summary="Database Status", description="Return a quick DB connectivity/status check")
async def db_status():
    """Return a quick DB connectivity/status check."""
    result = await database_status()
    if result.get("connected"):
        return SuccessResponseDTO(
            message="Database connection successful",
            data={"connection_time": result.get("connection_time")}
        )
    else:
        raise HTTPException(status_code=503, detail="Database connection failed")
