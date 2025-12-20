"""
Database management endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.database import run_migrations, create_migration, get_migration_status

router = APIRouter()


class MigrationRequest(BaseModel):
    """Migration creation request"""
    message: str


class MigrationResponse(BaseModel):
    """Migration response"""
    status: str
    output: str


@router.post("/migrate", response_model=MigrationResponse)
async def run_database_migrations():
    """Run pending database migrations"""
    try:
        result = await run_migrations()
        if result["status"] == "success":
            return MigrationResponse(status="success", output=result["output"])
        else:
            raise HTTPException(status_code=500, detail=result["output"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.post("/migrate/create", response_model=MigrationResponse)
async def create_database_migration(request: MigrationRequest):
    """Create a new database migration"""
    try:
        result = await create_migration(request.message)
        if result["status"] == "success":
            return MigrationResponse(status="success", output=result["output"])
        else:
            raise HTTPException(status_code=500, detail=result["output"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration creation failed: {str(e)}")


@router.get("/migrate/status", response_model=MigrationResponse)
async def get_database_migration_status():
    """Get current database migration status"""
    try:
        result = await get_migration_status()
        return MigrationResponse(status=result["status"], output=result["output"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get migration status: {str(e)}")
