#!/bin/bash

# start-apis.sh - Script to start all API servers for the RAG application
# This script starts the FastAPI backend server

set -e  # Exit on any error

echo "🚀 Starting API Servers for RAG Application"
echo "==========================================="

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

    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+"
        exit 1
    fi

    if ! command -v pip &> /dev/null; then
        print_error "pip is not installed. Please install pip"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        print_warning "curl is not installed. Some health checks may fail."
    fi

    print_success "System dependencies check passed"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment configuration..."

    # Check for backend .env file
    if [ ! -f "backend/.env" ]; then
        print_warning "backend/.env file not found. Using default configuration."
        print_status "Copying backend/.env.example to backend/.env..."
        cp backend/.env.example backend/.env
        print_warning "Please edit backend/.env with your actual configuration values"
        exit 1
    fi

    # Check for required environment variables in .env file
    if ! grep -q "^QDRANT_API_KEY=" backend/.env || grep -q "^QDRANT_API_KEY=your_qdrant_api_key_here" backend/.env; then
        print_error "QDRANT_API_KEY is not properly configured in backend/.env"
        print_status "Please edit backend/.env and set QDRANT_API_KEY with your actual QDrant API key"
        print_status "You can get an API key from https://cloud.qdrant.io"
        exit 1
    fi

    if ! grep -q "^QDRANT_URL=" backend/.env || grep -q "^QDRANT_URL=https://your-qdrant-instance" backend/.env; then
        print_error "QDRANT_URL is not properly configured in backend/.env"
        print_status "Please edit backend/.env and set QDRANT_URL with your actual QDrant instance URL"
        exit 1
    fi

    print_success "Environment configuration check passed"
}

# Check if embedding service is running
check_embedding_service() {
    print_status "Checking embedding service at http://localhost:8080..."

    if command -v curl &> /dev/null; then
        if curl -f -s http://localhost:8080/health > /dev/null 2>&1 || curl -f -s http://localhost:8080/v1/models > /dev/null 2>&1; then
            print_success "Embedding service is running"
        else
            print_warning "Embedding service at http://localhost:8080 is not responding"
            print_status "Make sure your embedding model server is running on port 8080"
            print_status "You can start it with: your_embedding_server_command --port 8080"
        fi
    else
        print_warning "Cannot check embedding service (curl not available)"
    fi
}

# Install Python dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."

    cd backend

    # Install core dependencies first (for better caching)
    if [ -f "requirements-core.txt" ]; then
        print_status "Installing core dependencies..."
        pip install -r requirements-core.txt
    fi

    # Install additional dependencies
    if [ -f "requirements.txt" ]; then
        print_status "Installing additional dependencies..."
        pip install -r requirements.txt
    fi

    cd ..
    print_success "Python dependencies installed"
}

# Start the FastAPI backend server
start_backend() {
    print_status "Starting FastAPI backend server on port 8000..."

    cd backend

    # Set PYTHONPATH to include the backend directory
    export PYTHONPATH="${PYTHONPATH}:$(pwd)"

    # Start the server with uvicorn (no auto-reload for stability)
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info &
    BACKEND_PID=$!

    cd ..

    # Wait a moment for server to start
    sleep 5

    # Check if server is responding
    if command -v curl &> /dev/null; then
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "FastAPI backend server started successfully"
            print_status "Backend API available at: http://localhost:8000"
            print_status "API Documentation at: http://localhost:8000/docs"
        else
            print_error "Backend server failed to start properly"
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
    else
        print_success "FastAPI backend server started (PID: $BACKEND_PID)"
        print_status "Backend API should be available at: http://localhost:8000"
    fi

    # Store PID for cleanup
    echo $BACKEND_PID > .backend_pid
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    if [ -f ".backend_pid" ]; then
        BACKEND_PID=$(cat .backend_pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "Stopping backend server (PID: $BACKEND_PID)"
            kill $BACKEND_PID
        fi
        rm -f .backend_pid
    fi
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    check_dependencies
    check_environment
    check_embedding_service
    install_dependencies
    start_backend

    print_success "All API servers started successfully!"
    echo ""
    print_status "Services running:"
    print_status "  • FastAPI Backend: http://localhost:8000"
    print_status "  • API Docs: http://localhost:8000/docs"
    print_status "  • Health Check: http://localhost:8000/health"
    echo ""
    print_status "Press Ctrl+C to stop all servers"

    # Wait for user interrupt
    wait
}

# Run main function
main "$@"
