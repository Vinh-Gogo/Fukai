from celery import Celery
import os
from ..constants import DATABASE_URL

# Celery configuration
celery_app = Celery(
    "rag_server",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["src.rag_server.tasks"]
)

# Celery settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour timeout
    task_soft_time_limit=3300,  # 55 minutes soft timeout
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=50,
    result_expires=3600,  # Results expire in 1 hour
)

# Database configuration for Celery tasks
celery_app.conf.update(
    database_url=DATABASE_URL,
)
