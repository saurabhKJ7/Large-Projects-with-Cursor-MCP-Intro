#!/bin/bash

# Kill any process using port 8000
kill_port() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        lsof -ti :8000 | xargs kill -9 2>/dev/null
    else
        # Linux
        fuser -k 8000/tcp 2>/dev/null
    fi
}

echo "Stopping any existing process on port 8000..."
kill_port

echo "Starting the backend server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 