#!/bin/bash

# Integration test script for Next.js + FastAPI hybrid system
# This script tests that both services are running and can communicate

set -e

echo "🚀 Testing Next.js + FastAPI Integration"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    echo -n "Testing $description ($url)... "

    if curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$url" | grep -q "^$expected_status$"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Check if services are running
echo "📋 Checking service availability..."
echo

# Test FastAPI backend
if test_endpoint "http://localhost:8000/health" 200 "FastAPI Health"; then
    FASTAPI_RUNNING=true
    echo "  FastAPI is running on port 8000"
else
    FASTAPI_RUNNING=false
    echo "  FastAPI is not accessible on port 8000"
fi

# Test Next.js frontend
if test_endpoint "http://localhost:3000/api/health" 200 "Next.js Health"; then
    NEXTJS_RUNNING=true
    echo "  Next.js is running on port 3000"
else
    NEXTJS_RUNNING=false
    echo "  Next.js is not accessible on port 3000"
fi

echo

# If both services are running, test integration
if [ "$FASTAPI_RUNNING" = true ] && [ "$NEXTJS_RUNNING" = true ]; then
    echo "🔗 Testing service integration..."
    echo

    # Test FastAPI endpoints
    test_endpoint "http://localhost:8000/docs" 200 "FastAPI Documentation"
    test_endpoint "http://localhost:8000/api/v1/health/" 200 "FastAPI API Health"
    test_endpoint "http://localhost:8000/api/v1/crawl/test" 200 "FastAPI Crawler Test"

    # Test Next.js API routes that communicate with FastAPI
    test_endpoint "http://localhost:3000/api/health" 200 "Next.js Health Check"

    echo
    echo -e "${GREEN}✅ Integration test completed successfully!${NC}"
    echo "Both services are running and communicating properly."
    echo
    echo "📖 Available endpoints:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000/docs"
    echo "  Health Check: http://localhost:3000/api/health"

elif [ "$FASTAPI_RUNNING" = false ] && [ "$NEXTJS_RUNNING" = false ]; then
    echo -e "${RED}❌ Both services are not running${NC}"
    echo
    echo "To start the services, run:"
    echo "  docker-compose up --build"
    echo
    echo "Or start individually:"
    echo "  FastAPI: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo "  Next.js: npm run dev"

elif [ "$FASTAPI_RUNNING" = false ]; then
    echo -e "${YELLOW}⚠️  FastAPI backend is not running${NC}"
    echo "Next.js is running but cannot communicate with the backend."
    echo
    echo "To start FastAPI backend:"
    echo "  docker-compose up backend"
    echo "  or: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

elif [ "$NEXTJS_RUNNING" = false ]; then
    echo -e "${YELLOW}⚠️  Next.js frontend is not running${NC}"
    echo "FastAPI is running but the frontend is not accessible."
    echo
    echo "To start Next.js frontend:"
    echo "  docker-compose up frontend"
    echo "  or: npm run dev"
fi

echo
echo "🔧 Configuration:"
echo "  NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8000/api/v1}"
echo "  NEXT_PUBLIC_FASTAPI_URL: ${NEXT_PUBLIC_FASTAPI_URL:-http://localhost:8000}"
