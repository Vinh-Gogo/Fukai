# Multi-stage FastAPI Backend Dockerfile with optimized build
FROM python:3.11-slim AS builder

# Set environment variables for build optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=600 \
    PIP_VERBOSE=1

# Install system build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for clean dependency isolation
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install wheel in virtual environment
RUN pip install --upgrade pip setuptools wheel

# Copy and install core dependencies first (for better layer caching)
COPY requirements-core.txt .
RUN pip install --timeout 600 --retries 3 -r requirements-core.txt

# Copy and install remaining dependencies
COPY requirements.txt .
RUN pip install --timeout 600 --retries 3 -r requirements.txt

# Production stage - minimal runtime image
FROM python:3.11-slim AS production

# Set environment variables for production
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PATH="/opt/venv/bin:$PATH"

# Install only runtime system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create non-root user
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --create-home --shell /bin/bash app && \
    mkdir -p /app/uploads /app/logs && \
    chown -R app:appgroup /app

# Set work directory
WORKDIR /app

# Copy application code with proper ownership
COPY --chown=app:appgroup . .

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Health check with improved configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f --max-time 5 http://localhost:8000/health || exit 1

# Run the application with optimized settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--loop", "uvloop", "--http", "httptools"]
