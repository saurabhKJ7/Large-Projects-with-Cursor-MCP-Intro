# Document Analyzer

This project implements a simple MCP (Multi-Component Platform) server for analyzing text documents. It provides functionalities for sentiment analysis, keyword extraction, readability scoring, and basic document statistics.

## Features:
- **Sentiment Analysis**: Determines the sentiment of a given text (positive, negative, neutral).
- **Keyword Extraction**: Identifies and extracts the most relevant keywords from a document.
- **Readability Scoring**: Calculates readability scores for text.
- **Basic Statistics**: Provides word count and sentence count for documents.
- **Document Storage**: Manages a collection of sample documents with associated metadata.

## MCP Tools Implemented:
- `analyze_document(document_id)`: Performs a full analysis on a document identified by its ID.
- `get_sentiment(text)`: Returns the sentiment for any given text.
- `extract_keywords(text, limit)`: Extracts a specified number of top keywords from text.
- `add_document(document_data)`: Adds a new document to the system.
- `search_documents(query)`: Searches for documents based on content.