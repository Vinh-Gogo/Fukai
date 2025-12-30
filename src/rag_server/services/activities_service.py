from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, desc, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.db import get_db
from ..models.models import Activity

async def log_activity(
    activity_type: str,
    entity_type: str,
    action: str,
    entity_id: Optional[int] = None,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log an activity to the database."""
    db: AsyncSession = await anext(get_db())
    try:
        activity = Activity(
            activity_type=activity_type,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(activity)
        await db.commit()
    except Exception as e:
        print(f"Failed to log activity: {e}")
    finally:
        await db.close()

async def get_activities(
    limit: int = 50,
    offset: int = 0,
    activity_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Optional[AsyncSession] = None
) -> List[Dict[str, Any]]:
    """Retrieve activities with optional filtering."""
    should_close_db = db is None
    if db is None:
        db = await anext(get_db())

    try:
        query = select(Activity).order_by(desc(Activity.timestamp))

        # Apply filters
        filters = []
        if activity_type:
            filters.append(Activity.activity_type == activity_type)
        if entity_type:
            filters.append(Activity.entity_type == entity_type)
        if action:
            filters.append(Activity.action == action)
        if user_id:
            filters.append(Activity.user_id == user_id)
        if start_date:
            filters.append(Activity.timestamp >= start_date)
        if end_date:
            filters.append(Activity.timestamp <= end_date)

        if filters:
            query = query.where(and_(*filters))

        # Apply pagination
        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        activities = result.scalars().all()

        return [
            {
                "id": activity.id,
                "activity_type": activity.activity_type,
                "entity_type": activity.entity_type,
                "entity_id": activity.entity_id,
                "action": activity.action,
                "timestamp": activity.timestamp.isoformat(),
                "user_id": activity.user_id,
                "details": activity.details,
                "ip_address": activity.ip_address,
                "user_agent": activity.user_agent
            }
            for activity in activities
        ]
    finally:
        if should_close_db:
            await db.close()

async def get_activity_stats(
    days: int = 7,
    db: Optional[AsyncSession] = None
) -> Dict[str, Any]:
    """Get activity statistics for the last N days."""
    should_close_db = db is None
    if db is None:
        db = await anext(get_db())

    try:
        start_date = datetime.utcnow() - timedelta(days=days)

        # Get total activities
        total_query = select(Activity).where(Activity.timestamp >= start_date)
        total_result = await db.execute(total_query)
        total_activities = len(total_result.scalars().all())

        # Get activities by type
        type_query = select(Activity.activity_type, Activity.id).where(Activity.timestamp >= start_date)
        type_result = await db.execute(type_query)
        type_counts = {}
        for activity_type, _ in type_result:
            type_counts[activity_type] = type_counts.get(activity_type, 0) + 1

        # Get activities by entity type
        entity_query = select(Activity.entity_type, Activity.id).where(Activity.timestamp >= start_date)
        entity_result = await db.execute(entity_query)
        entity_counts = {}
        for entity_type, _ in entity_result:
            entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1

        # Get activities by action
        action_query = select(Activity.action, Activity.id).where(Activity.timestamp >= start_date)
        action_result = await db.execute(action_query)
        action_counts = {}
        for action, _ in action_result:
            action_counts[action] = action_counts.get(action, 0) + 1

        return {
            "period_days": days,
            "total_activities": total_activities,
            "activities_by_type": type_counts,
            "activities_by_entity": entity_counts,
            "activities_by_action": action_counts
        }
    finally:
        if should_close_db:
            await db.close()

async def get_recent_activities(
    limit: int = 10,
    db: Optional[AsyncSession] = None
) -> List[Dict[str, Any]]:
    """Get the most recent activities."""
    return await get_activities(limit=limit, offset=0, db=db)
