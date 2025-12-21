#!/bin/bash

# start-frontend.sh - Script to start the website interface for the RAG application
# This script starts the Next.js frontend development server

set -e  # Exit on any error

echo "🌐 Starting Frontend Website for RAG Application"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking system dependencies..."

    if ! command -v node &> /dev/null && ! command -v nodejs &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi

    if ! command -v npm &> /dev/null && ! command -v pnpm &> /dev/null && ! command -v yarn &> /dev/null; then
        print_error "No package manager found. Please install npm, pnpm, or yarn"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        print_warning "curl is not installed. Some health checks may fail."
    fi

    print_success "System dependencies check passed"
}

# Check if backend API is accessible
check_backend_api() {
    print_status "Checking backend API at http://localhost:8000..."

    if command -v curl &> /dev/null; then
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend API is running"
        else
            print_warning "Backend API at http://localhost:8000 is not responding"
            print_status "Make sure to start the API servers first with: ./start-apis.sh"
            print_status "The frontend will still start, but API calls may fail"
        fi
    else
        print_warning "Cannot check backend API (curl not available)"
    fi
}

# Check and create environment file
setup_environment() {
    print_status "Setting up frontend environment..."

    # Check for .env.local file (Next.js specific)
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local file not found. Creating with default values..."
        cat > .env.local << EOF
# Frontend Environment Variables (Next.js)
# These variables are exposed to the browser (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development

# Optional: Configure these if needed for production
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
# NEXT_PUBLIC_SENTRY_DSN=

# Bundle analyzer for performance monitoring
ANALYZE=false
EOF
        print_status "Created .env.local with default configuration"
        print_warning "Please review and update .env.local if needed"
    fi

    # Check for main .env file
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Copying from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_status "Copied .env.example to .env"
            print_warning "Please update .env with your actual configuration values"
        else
            print_error ".env.example not found. Please create environment configuration manually."
            exit 1
        fi
    fi

    print_success "Frontend environment setup complete"
}

# Install Node.js dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."

    # Determine which package manager to use
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
    elif command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
    else
        PACKAGE_MANAGER="npm"
    fi

    print_status "Using package manager: $PACKAGE_MANAGER"

    case $PACKAGE_MANAGER in
        pnpm)
            pnpm install
            ;;
        yarn)
            yarn install
            ;;
        npm)
            npm install
            ;;
    esac

    print_success "Node.js dependencies installed"
}

# Start the Next.js development server
start_frontend() {
    print_status "Starting Next.js frontend server on port 3000..."

    # Determine which package manager to use for running
    if command -v pnpm &> /dev/null && [ -f "pnpm-lock.yaml" ]; then
        PACKAGE_MANAGER="pnpm"
    elif command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
        PACKAGE_MANAGER="yarn"
    else
        PACKAGE_MANAGER="npm"
    fi

    print_status "Using package manager: $PACKAGE_MANAGER"

    # Start the development server
    case $PACKAGE_MANAGER in
        pnpm)
            pnpm dev &
            ;;
        yarn)
            yarn dev &
            ;;
        npm)
            npm run dev &
            ;;
    esac

    FRONTEND_PID=$!

    # Wait a moment for server to start
    sleep 5

    # Check if server is responding
    if command -v curl &> /dev/null; then
        if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1 || curl -f -s -I http://localhost:3000 > /dev/null 2>&1; then
            print_success "Next.js frontend server started successfully"
            print_status "Frontend website available at: http://localhost:3000"
        else
            print_error "Frontend server failed to start properly"
            kill $FRONTEND_PID 2>/dev/null || true
            exit 1
        fi
    else
        print_success "Next.js frontend server started (PID: $FRONTEND_PID)"
        print_status "Frontend website should be available at: http://localhost:3000"
    fi

    # Store PID for cleanup
    echo $FRONTEND_PID > .frontend_pid
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    if [ -f ".frontend_pid" ]; then
        FRONTEND_PID=$(cat .frontend_pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "Stopping frontend server (PID: $FRONTEND_PID)"
            kill $FRONTEND_PID
        fi
        rm -f .frontend_pid
    fi
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # We are now in the root directory with src/ structure
    check_dependencies
    check_backend_api
    setup_environment
    install_dependencies
    start_frontend

    print_success "Frontend website started successfully!"
    echo ""
    print_status "Services running:"
    print_status "  • Frontend Website: http://localhost:3000"
    echo ""
    print_status "Press Ctrl+C to stop the frontend server"
    echo ""
    print_status "Note: Make sure the API servers are running with ./start-apis.sh"
    echo "      for full functionality"

    # Wait for user interrupt
    wait
}

# Run main function
main "$@"
