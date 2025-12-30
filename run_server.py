#!/usr/bin/env python3
"""
Launcher script for the RAG Server.

This script allows running the server from the project root directory
using either direct execution or module execution.
"""

import sys
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv not available, try manual loading
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# Add src directory to Python path so imports work
src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Now import and run the main application
from rag_server.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_server.main:app", host="127.0.0.1", port=8000, reload=True)
