#!/bin/bash

# Docker Test Script
# Runs comprehensive tests for the hybrid Next.js + FastAPI system

set -e

echo "🧪 Testing Next.js + FastAPI system"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local command=$2

    echo -n "Testing $test_name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_code=${2:-200}
    local description=$3

    run_test "$description" "curl -s --max-time 10 -o /dev/null -w '%{http_code}' '$url' | grep -q '^$expected_code$'"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo "🐳 Docker is running"
echo

# Test Docker Compose files
echo "📋 Testing Docker Compose configurations..."
run_test "docker-compose.yml exists" "test -f docker-compose.yml"
run_test "docker-compose.dev.yml exists" "test -f docker-compose.dev.yml"
run_test "docker-compose.prod.yml exists" "test -f docker-compose.prod.yml"
echo

# Test Dockerfiles
echo "🏗️  Testing Dockerfiles..."
run_test "backend Dockerfile exists" "test -f backend/Dockerfile"
run_test "frontend Dockerfile exists" "test -f frontend/Dockerfile"
echo

# Test build scripts
echo "🔨 Testing build scripts..."
run_test "build.sh is executable" "test -x scripts/build.sh"
run_test "deploy.sh is executable" "test -x scripts/deploy.sh"
run_test "test.sh is executable" "test -x scripts/test.sh"
echo

# Test project structure
echo "📁 Testing project structure..."
run_test "backend/app directory exists" "test -d ../backend/app"
run_test "src directory exists" "test -d ../src"
run_test "backend requirements.txt exists" "test -f ../backend/requirements.txt"
run_test "package.json exists" "test -f ../package.json"
echo

# Test configuration files
echo "⚙️  Testing configuration files..."
run_test "next.config.ts exists" "test -f ../next.config.ts"
run_test "backend config exists" "test -f ../backend/app/core/config.py"
echo

# Summary
echo "📊 Test Results:"
echo "==============="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total:  $((PASSED + FAILED))"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Your Docker setup is ready.${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Build images: ./docker/scripts/build.sh"
    echo "  2. Start dev env: docker-compose -f docker/docker-compose.dev.yml up"
    echo "  3. Run integration tests: ../test-integration.sh"
    echo "  4. Deploy to prod: ./docker/scripts/deploy.sh"
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
