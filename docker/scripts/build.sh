#!/bin/bash

# Docker Build Script
# Builds all Docker images for the hybrid Next.js + FastAPI system

set -e

echo "🐳 Building Docker images for Next.js + FastAPI system"
echo "====================================================="

# Change to project root directory (where docker/ is located)
cd "$(dirname "$0")/.."
echo "Working directory: $(pwd)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to build with timing
build_image() {
    local service_name=$1
    local context=$2
    local dockerfile=$3

    echo -n "Building $service_name... "

    if docker build -f "$dockerfile" -t "search-rag-$service_name:latest" "$context" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ SUCCESS${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Build all services
echo "Building services..."
echo

# Build backend first (it has fewer dependencies)
build_image "backend" "../backend" "docker/backend/Dockerfile"

# Build frontend
build_image "frontend" ".." "docker/frontend/Dockerfile"

echo
echo -e "${GREEN}✅ All Docker images built successfully!${NC}"
echo
echo "Available images:"
docker images | grep search-rag
echo
echo "Next steps:"
echo "  Development: docker-compose -f docker/docker-compose.dev.yml up"
echo "  Production:  docker-compose -f docker/docker-compose.prod.yml up -d"
