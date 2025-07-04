# Document Analyzer MCP Server

A powerful text document analysis server built with the MCP protocol. This server provides sentiment analysis, keyword extraction, readability metrics, and document management capabilities with multiple deployment options including a web interface and Docker support.

## Features

### Analysis Capabilities

- **Sentiment Analysis**: Determine if text is positive, negative, or neutral with confidence scores
- **Keyword Extraction**: Identify top terms using TF-IDF with configurable limits
- **Readability Metrics**: Calculate Flesch scores, grade level, and estimated reading time
- **Text Statistics**: Word count, sentence count, paragraph count, and unique word count

### Document Management

- Store documents with metadata (title, author, date, category)
- Search documents by content or metadata
- List all stored documents

### Deployment Options

- **MCP Server**: Run as a standard MCP protocol server
- **Web Application**: User-friendly web interface for document analysis
- **Docker Support**: Containerized deployment with Docker and docker-compose
- **Library Usage**: Use analysis functions directly in your Python code

## Project Structure

```
/Document Analyzer/
├── server.py                # Main MCP server implementation
├── generate_sample_data.py  # Script to generate sample documents
├── client_example.py        # Example client usage
├── test_server.py           # Unit tests for the server
├── web_app_example.py       # Flask web application interface
├── library_usage_example.py # Example of using as a Python library
├── batch_process_example.py # Example of batch processing documents
├── run_server.py            # Simplified server startup script
├── requirements.txt         # Python dependencies
├── setup.sh                 # Setup script for Unix/Linux/Mac
├── setup.bat                # Setup script for Windows
├── Dockerfile               # Docker container definition
├── docker-compose.yml       # Docker Compose configuration
├── .gitignore               # Git ignore file
├── README.md                # This file
└── data/                    # Directory for document storage
    └── documents.json       # JSON file storing all documents
```

## Installation

### Standard Installation

1. Clone this repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

### Using Setup Scripts

#### For Unix/Linux/Mac:

```bash
chmod +x setup.sh
./setup.sh
```

#### For Windows:

```bash
setup.bat
```

### Using Docker

```bash
# Build and start both MCP server and web application
docker-compose up -d

# Or build and run just the MCP server
docker build -t document-analyzer .
docker run -p 8000:8000 document-analyzer

# Or run just the web application
docker run -p 5000:5000 document-analyzer web
```

## Getting Started

### 1. Generate Sample Data

Populate the server with sample documents:

```bash
python generate_sample_data.py
```

This will create 15+ diverse documents with various content types, sentiment patterns, and readability levels.

### 2. Start the Server

Start the MCP server with:

```bash
python -m mcp serve server.py
```

Or use the simplified run script:

```bash
python run_server.py
```

### 3. Web Application (Optional)

Start the web-based user interface:

```bash
python web_app_example.py
```

Then open http://127.0.0.1:5000 in your browser.

### 4. Run the Example Client

Test the server functionality with the example client:

```bash
python client_example.py
```

This demonstrates various features including sentiment analysis, keyword extraction, document storage, and search.

### 5. Run Tests

Verify that the server is working correctly:

```bash
python test_server.py
```

### 6. Additional Examples

#### Use as a Python Library

```bash
python library_usage_example.py
```

#### Batch Process Documents

```bash
python batch_process_example.py
```

## MCP Tools API Reference

### analyze_document

Perform full analysis of a stored document.

```python
result = await client.analyze_document(document_id="doc_12345")
```

### get_sentiment

Analyze sentiment of any text.

```python
result = await client.get_sentiment(text="I love this product! It's amazing.")
```

### extract_keywords

Extract top keywords from text.

```python
result = await client.extract_keywords(text="Machine learning algorithms are transforming the field of artificial intelligence.", limit=5)
```

### add_document

Store a new document with metadata.

```python
result = await client.add_document({
    "title": "The Future of AI",
    "content": "Artificial intelligence is rapidly evolving...",
    "author": "Jane Smith",
    "date": "2023-05-15",
    "category": "Technology"
})
```

### search_documents

Search documents by content or metadata.

```python
results = await client.search_documents(query="artificial intelligence")
```

### list_documents

List all stored documents with basic metadata.

```python
documents = await client.list_documents()
```

## Technical Details

- Built with Python and the MCP protocol
- Uses NLTK for natural language processing
- TF-IDF for keyword extraction
- VADER for sentiment analysis
- Documents stored as JSON files

## Requirements

- Python 3.7+
- MCP package
- NLTK
- scikit-learn
- Flask (for web application)
- Docker (optional, for containerized deployment)

## License

MIT