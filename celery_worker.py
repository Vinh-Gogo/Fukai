#!/usr/bin/env python3
"""
Celery Worker Startup Script for RAG Server

This script starts the Celery worker for background PDF processing tasks.

Usage:
    python celery_worker.py

Requirements:
    - Redis server running on localhost:6379
    - All dependencies installed (see requirements.txt)

Environment Variables:
    - CELERY_BROKER_URL: Redis broker URL (default: redis://localhost:6379/0)
    - CELERY_RESULT_BACKEND: Redis result backend URL (default: redis://localhost:6379/0)
"""

import os
import sys

# Add src directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

def main():
    """Start the Celery worker."""
    # Explicitly import tasks to ensure they are registered
    from rag_server import tasks  # This ensures all @celery_app.task decorators are executed
    from rag_server.core.celery_app import celery_app

    print("Starting RAG Server Celery Worker...")
    print("Broker:", celery_app.conf.broker_url)
    print("Backend:", celery_app.conf.result_backend)
    print("Include modules:", celery_app.conf.include)
    print("Available tasks:", list(celery_app.tasks.keys()))
    print()

    # Start the worker
    argv = [
        'worker',
        '--loglevel=info',
        '--concurrency=2',  # Limit concurrent tasks
        '--pool=solo',      # Use solo pool for Windows compatibility (no multiprocessing)
        '--hostname=rag-worker@%h'
    ]

    celery_app.start(argv)

if __name__ == '__main__':
    main()
