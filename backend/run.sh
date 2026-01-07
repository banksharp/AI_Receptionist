#!/bin/bash
# Backend startup script

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the server
echo "Starting backend server on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
uvicorn main:app --reload --host 0.0.0.0 --port 8000

