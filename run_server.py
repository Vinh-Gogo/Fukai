#!/usr/bin/env python3
"""
Launcher script for the RAG Server.

This script allows running the server from the project root directory
using either direct execution or module execution.
"""

import sys
import os

# Add src directory to Python path so imports work
src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Now import and run the main application
from rag_server.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_server.main:app", host="127.0.0.1", port=8000, reload=True)
