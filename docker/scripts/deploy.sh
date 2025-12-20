#!/bin/bash

# Docker Deployment Script
# Deploys the hybrid Next.js + FastAPI system to production

set -e

echo "🚀 Deploying Next.js + FastAPI system to production"
echo "=================================================="

# Change to project root directory (where docker/ is located)
cd "$(dirname "$0")/.."
echo "Working directory: $(pwd)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker/docker-compose.prod.yml"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Function to check if services are healthy
check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -n "Waiting for $service to be healthy... "

    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ READY${NC}"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "${RED}✗ TIMEOUT${NC}"
    return 1
}

# Create backup if database exists
if [ -f "./backend/app.db" ]; then
    echo "📦 Creating database backup..."
    mkdir -p "$BACKUP_DIR"
    cp "./backend/app.db" "$BACKUP_DIR/"
    cp "./backend/uploads/"* "$BACKUP_DIR/uploads/" 2>/dev/null || true
    echo "Backup created at: $BACKUP_DIR"
    echo
fi

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f "$COMPOSE_FILE" down || true
echo

# Build and start services
echo "🐳 Building and starting services..."
docker-compose -f "$COMPOSE_FILE" up --build -d
echo

# Wait for services to be ready
echo "🏥 Checking service health..."
check_health "FastAPI Backend" "http://localhost:8000/health"
check_health "Next.js Frontend" "http://localhost/api/health"
echo

# Run integration tests
echo "🧪 Running integration tests..."
if ../test-integration.sh; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo
    echo "📖 Service URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:8000/docs"
    echo "  Health Check: http://localhost/api/health"
    echo
    echo "🔄 To check logs:"
    echo "  docker-compose -f $COMPOSE_FILE logs -f"
    echo
    echo "⏹️  To stop services:"
    echo "  docker-compose -f $COMPOSE_FILE down"
else
    echo -e "${RED}❌ Integration tests failed!${NC}"
    echo "Check the logs for more information:"
    echo "  docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi
