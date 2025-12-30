from fastapi import APIRouter, Query, Depends
from typing import List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_db
from ...services.activities_service import get_activities, get_activity_stats, get_recent_activities
from .dtos import (
    ActivityResponseDTO,
    ActivityListResponseDTO,
    ActivityStatsDTO,
    ActivityFilterDTO,
    PaginationDTO
)

router = APIRouter()

@router.get("", response_model=ActivityListResponseDTO, summary="List Activities", description="Get paginated list of activities with filtering")
async def list_activities(
    limit: int = Query(50, ge=1, le=1000, description="Number of activities to return"),
    offset: int = Query(0, ge=0, description="Number of activities to skip"),
    activity_type: str = Query(None, description="Filter by activity type"),
    entity_type: str = Query(None, description="Filter by entity type"),
    action: str = Query(None, description="Filter by action"),
    user_id: str = Query(None, description="Filter by user ID"),
    start_date: datetime = Query(None, description="Filter activities after this date"),
    end_date: datetime = Query(None, description="Filter activities before this date"),
    db: AsyncSession = Depends(get_db)
):
    """Get a paginated list of activities with optional filtering."""
    activities = await get_activities(
        limit=limit,
        offset=offset,
        activity_type=activity_type,
        entity_type=entity_type,
        action=action,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        db=db
    )

    # Convert to DTOs
    activity_dtos = [
        ActivityResponseDTO(
            id=activity.id,
            activity_type=activity.activity_type,
            entity_type=activity.entity_type,
            entity_id=activity.entity_id,
            action=activity.action,
            timestamp=activity.timestamp,
            user_id=activity.user_id,
            details=activity.details,
            ip_address=activity.ip_address,
            user_agent=activity.user_agent
        ) for activity in activities
    ]

    return ActivityListResponseDTO(
        items=activity_dtos,
        total=len(activity_dtos),  # This should be improved with proper count
        page=1,  # This should be calculated from offset/limit
        limit=limit,
        pages=1,  # This should be calculated
        has_next=False,  # This should be calculated
        has_prev=False   # This should be calculated
    )

@router.get("/recent", response_model=List[ActivityResponseDTO], summary="Recent Activities", description="Get the most recent activities")
async def get_recent_activities_endpoint(
    limit: int = Query(10, ge=1, le=100, description="Number of recent activities to return"),
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent activities."""
    activities = await get_recent_activities(limit=limit, db=db)

    return [
        ActivityResponseDTO(
            id=activity.id,
            activity_type=activity.activity_type,
            entity_type=activity.entity_type,
            entity_id=activity.entity_id,
            action=activity.action,
            timestamp=activity.timestamp,
            user_id=activity.user_id,
            details=activity.details,
            ip_address=activity.ip_address,
            user_agent=activity.user_agent
        ) for activity in activities
    ]

@router.get("/stats", response_model=ActivityStatsDTO, summary="Activity Statistics", description="Get activity statistics for the specified period")
async def get_activity_stats_endpoint(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db)
):
    """Get activity statistics for the specified period."""
    stats = await get_activity_stats(days=days, db=db)

    return ActivityStatsDTO(
        total_activities=stats.get("total_activities", 0),
        activities_by_type=stats.get("activities_by_type", {}),
        activities_by_action=stats.get("activities_by_action", {}),
        activities_by_entity=stats.get("activities_by_entity", {}),
        recent_activities=[
            ActivityResponseDTO(
                id=activity.id,
                activity_type=activity.activity_type,
                entity_type=activity.entity_type,
                entity_id=activity.entity_id,
                action=activity.action,
                timestamp=activity.timestamp,
                user_id=activity.user_id,
                details=activity.details,
                ip_address=activity.ip_address,
                user_agent=activity.user_agent
            ) for activity in stats.get("recent_activities", [])
        ],
        period_days=days
    )
