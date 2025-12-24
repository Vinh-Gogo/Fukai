# Search RAG Backend Dockerfile

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd --create-home --shell /bin/bash app

# Set work directory
WORKDIR /app

# Change ownership of work directory
RUN chown app:app /app

# Switch to app user
USER app

# Copy requirements and install Python dependencies
COPY --chown=app:app requirements/base.txt ./requirements/base.txt
COPY --chown=app:app requirements/prod.txt ./requirements/prod.txt

# Install both base and production dependencies (celery workers need celery from base.txt)
RUN pip install --user -r requirements/base.txt -r requirements/prod.txt

# Copy application code
COPY --chown=app:app . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "-m", "app.main"]
