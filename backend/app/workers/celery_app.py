"""
Celery application configuration for background task processing.

This module configures Celery for handling background tasks such as
document processing, indexing, and other async operations.
"""

from celery import Celery
from app.config.settings import settings


# Create Celery app instance
celery_app = Celery(
    "search_rag_backend",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,

    # Result backend settings
    result_expires=3600,  # 1 hour
    result_backend_transport_options={
        "retry_policy": {"timeout": 5.0}
    },

    # Routing (if needed for different queues)
    task_routes={
        "app.workers.tasks.process_document": {"queue": "documents"},
        "app.workers.tasks.index_document": {"queue": "indexing"},
        "app.workers.tasks.cleanup_expired": {"queue": "maintenance"},
    },

    # Task time limits
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3300,  # 55 minutes

    # Beat scheduler settings (for periodic tasks)
    beat_schedule={
        "cleanup-expired-sessions": {
            "task": "app.workers.tasks.cleanup_expired",
            "schedule": 3600.0,  # Every hour
        },
        "health-check": {
            "task": "app.workers.tasks.health_check",
            "schedule": 300.0,  # Every 5 minutes
        },
    },
)


# Import tasks to register them with Celery
try:
    from app.workers import tasks  # noqa: F401
except ImportError:
    # Tasks module may not exist yet
    pass


if __name__ == "__main__":
    celery_app.start()
