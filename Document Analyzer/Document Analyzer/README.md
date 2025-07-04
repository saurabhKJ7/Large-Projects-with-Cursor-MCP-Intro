# Document Analyzer MCP Server

A powerful text document analysis server built with the MCP protocol. This server provides sentiment analysis, keyword extraction, readability metrics, and document management capabilities.

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

## Installation

1. Clone this repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Starting the Server

Start the MCP server with:

```bash
python -m mcp serve document_analyzer
```

Or run the server directly:

```bash
python server.py
```

### Available MCP Tools

#### analyze_document

Perform full analysis of a stored document.

```python
result = await analyze_document(document_id="doc_12345")
```

#### get_sentiment

Analyze sentiment of any text.

```python
result = await get_sentiment(text="I love this product! It's amazing.")
```

#### extract_keywords

Extract top keywords from text.

```python
result = await extract_keywords(text="Machine learning algorithms are transforming the field of artificial intelligence.", limit=5)
```

#### add_document

Store a new document with metadata.

```python
result = await add_document({
    "title": "The Future of AI",
    "content": "Artificial intelligence is rapidly evolving...",
    "author": "Jane Smith",
    "date": "2023-05-15",
    "category": "Technology"
})
```

#### search_documents

Search documents by content or metadata.

```python
results = await search_documents(query="artificial intelligence")
```

#### list_documents

List all stored documents with basic metadata.

```python
documents = await list_documents()
```

## Technical Details

- Built with Python and the MCP protocol
- Uses NLTK for natural language processing
- TF-IDF for keyword extraction
- VADER for sentiment analysis
- Documents stored as JSON files

## Sample Data

The server includes 15+ sample documents with various types of content, sentiment, and readability levels.

## License

MIT