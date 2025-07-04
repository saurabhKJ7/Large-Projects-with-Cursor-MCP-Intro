#!/usr/bin/env python3

import os
import sys
import subprocess
import argparse

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import mcp
        import nltk
        import sklearn
        return True
    except ImportError as e:
        print(f"Error: Missing dependency - {e}")
        print("Please install required dependencies with: pip install -r requirements.txt")
        return False

def setup_data_directory():
    """Ensure data directory exists"""
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Check if documents.json exists, create empty one if not
    documents_file = os.path.join(data_dir, "documents.json")
    if not os.path.exists(documents_file):
        with open(documents_file, "w") as f:
            f.write("{}")
        print(f"Created empty documents file at {documents_file}")

def generate_sample_data():
    """Generate sample documents if needed"""
    data_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "documents.json")
    
    # Check if documents.json is empty (just contains {})
    is_empty = False
    try:
        with open(data_file, "r") as f:
            content = f.read().strip()
            is_empty = content == "{}" or content == ""
    except:
        is_empty = True
    
    if is_empty:
        print("No documents found. Generating sample data...")
        try:
            # Import and run the sample data generator
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from generate_sample_data import main as generate_data
            generate_data()
        except Exception as e:
            print(f"Error generating sample data: {e}")
            print("You can manually generate sample data by running: python generate_sample_data.py")

def run_server(use_mcp_module=True):
    """Run the document analyzer server"""
    if use_mcp_module:
        # Run using MCP module
        cmd = [sys.executable, "-m", "mcp", "serve", "document_analyzer"]
        print("Starting Document Analyzer MCP Server...")
        print("Use Ctrl+C to stop the server")
        subprocess.run(cmd)
    else:
        # Run directly
        server_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")
        cmd = [sys.executable, server_path]
        print("Starting Document Analyzer Server directly...")
        print("Use Ctrl+C to stop the server")
        subprocess.run(cmd)

def main():
    parser = argparse.ArgumentParser(description="Run the Document Analyzer MCP Server")
    parser.add_argument("--direct", action="store_true", help="Run server directly instead of using MCP module")
    parser.add_argument("--no-sample-data", action="store_true", help="Don't generate sample data if none exists")
    args = parser.parse_args()
    
    # Check dependencies
    if not check_dependencies():
        return
    
    # Setup data directory
    setup_data_directory()
    
    # Generate sample data if needed
    if not args.no_sample_data:
        generate_sample_data()
    
    # Run the server
    run_server(not args.direct)

if __name__ == "__main__":
    main()