#!/bin/bash

# Document Analyzer Setup Script

set -e  # Exit on error

echo "=== Document Analyzer Setup ==="
echo ""

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 7 ]); then
    echo "Error: Python 3.7 or higher is required. Found Python $PYTHON_VERSION"
    exit 1
fi

echo "Python $PYTHON_VERSION detected."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Generate sample data
echo "Generating sample data..."
python generate_sample_data.py

echo ""
echo "Setup complete! You can now run the server with:"
echo "  source venv/bin/activate  # If not already activated"
echo "  python run_server.py"
echo ""
echo "Or use the MCP protocol directly:"
echo "  source venv/bin/activate  # If not already activated"
echo "  python -m mcp serve document_analyzer"
echo ""
echo "To run the example client:"
echo "  source venv/bin/activate  # If not already activated"
echo "  python client_example.py"