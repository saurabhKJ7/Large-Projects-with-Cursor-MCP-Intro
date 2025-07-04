#!/usr/bin/env python3

"""
Command Line Interface for Document Analyzer

This script provides a simple command-line interface to interact with the
document analyzer functionality without needing to run the MCP server.

Usage:
    python cli_tool.py sentiment "This is some text to analyze"
    python cli_tool.py keywords "Machine learning is transforming AI" --limit 5
    python cli_tool.py readability "This is a sample text to analyze for readability metrics."
    python cli_tool.py add "My Document Title" "Document content goes here" --author "John Doe" --category "Notes"
    python cli_tool.py search "machine learning"
    python cli_tool.py list
    python cli_tool.py analyze doc_12345
"""

import os
import sys
import json
import argparse
import asyncio
from datetime import datetime

# Add the current directory to the path so we can import from server.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the analysis functions directly from server.py
from server import (
    get_sentiment,
    extract_keywords,
    calculate_readability,
    add_document,
    search_documents,
    list_documents,
    analyze_document,
    load_documents,
    save_documents
)

# Ensure data directory exists
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(data_dir, exist_ok=True)

# Set up argument parser
def setup_parser():
    parser = argparse.ArgumentParser(description="Document Analyzer CLI Tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Sentiment analysis command
    sentiment_parser = subparsers.add_parser("sentiment", help="Analyze sentiment of text")
    sentiment_parser.add_argument("text", help="Text to analyze")
    
    # Keyword extraction command
    keywords_parser = subparsers.add_parser("keywords", help="Extract keywords from text")
    keywords_parser.add_argument("text", help="Text to analyze")
    keywords_parser.add_argument("--limit", type=int, default=10, help="Maximum number of keywords to extract")
    
    # Readability command
    readability_parser = subparsers.add_parser("readability", help="Calculate readability metrics")
    readability_parser.add_argument("text", help="Text to analyze")
    
    # Add document command
    add_parser = subparsers.add_parser("add", help="Add a new document")
    add_parser.add_argument("title", help="Document title")
    add_parser.add_argument("content", help="Document content")
    add_parser.add_argument("--author", default="Unknown", help="Document author")
    add_parser.add_argument("--category", default="Uncategorized", help="Document category")
    
    # Search documents command
    search_parser = subparsers.add_parser("search", help="Search documents")
    search_parser.add_argument("query", help="Search query")
    
    # List documents command
    list_parser = subparsers.add_parser("list", help="List all documents")
    
    # Analyze document command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze a specific document")
    analyze_parser.add_argument("document_id", help="Document ID to analyze")
    
    return parser

# Helper function to run async functions
def run_async(coro):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)

# Helper function to format sentiment output
def format_sentiment(sentiment):
    sentiment_type = sentiment["sentiment"]
    positive = sentiment["positive_score"]
    negative = sentiment["negative_score"]
    neutral = sentiment["neutral_score"]
    
    # Determine color codes for terminal output
    if sentiment_type == "positive":
        color = "\033[92m"  # Green
    elif sentiment_type == "negative":
        color = "\033[91m"  # Red
    else:
        color = "\033[93m"  # Yellow
    
    reset = "\033[0m"  # Reset color
    
    return f"""
{color}Sentiment: {sentiment_type.upper()}{reset}

Confidence Scores:
  Positive: {positive:.2f} ({positive*100:.1f}%)
  Negative: {negative:.2f} ({negative*100:.1f}%)
  Neutral:  {neutral:.2f} ({neutral*100:.1f}%)
"""

# Helper function to format keywords output
def format_keywords(keywords):
    result = "Top Keywords:\n"
    for i, kw in enumerate(keywords, 1):
        result += f"  {i}. {kw['keyword']} (score: {kw['score']:.3f})\n"
    return result

# Helper function to format readability output
def format_readability(readability):
    # Determine reading ease description
    score = readability["flesch_score"]
    if score >= 90:
        ease = "Very Easy"
    elif score >= 80:
        ease = "Easy"
    elif score >= 70:
        ease = "Fairly Easy"
    elif score >= 60:
        ease = "Standard"
    elif score >= 50:
        ease = "Fairly Difficult"
    elif score >= 30:
        ease = "Difficult"
    else:
        ease = "Very Difficult"
    
    # Format reading time
    seconds = readability["reading_time_seconds"]
    if seconds < 60:
        reading_time = f"{seconds:.0f} seconds"
    else:
        minutes = int(seconds // 60)
        remaining_seconds = int(seconds % 60)
        reading_time = f"{minutes} min {remaining_seconds} sec"
    
    return f"""
Readability Metrics:
  Flesch Reading Ease: {score:.1f} ({ease})
  Grade Level: {readability['grade_level']:.1f}
  Reading Time: {reading_time}

Text Statistics:
  Word Count: {readability['word_count']}
  Sentence Count: {readability['sentence_count']}
  Paragraph Count: {readability['paragraph_count']}
  Unique Words: {readability['unique_word_count']} ({readability['unique_word_count']/readability['word_count']*100:.1f}% of total)
"""

# Helper function to format document output
def format_document(doc):
    return f"""
Title: {doc['title']}
ID: {doc['id']}
Author: {doc['author']}
Category: {doc['category']}
Date: {doc['date']}
Word Count: {doc.get('word_count', 'N/A')}
"""

# Main function
def main():
    parser = setup_parser()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == "sentiment":
            result = run_async(get_sentiment(args.text))
            print(format_sentiment(result))
            
        elif args.command == "keywords":
            result = run_async(extract_keywords(args.text, args.limit))
            print(format_keywords(result))
            
        elif args.command == "readability":
            result = calculate_readability(args.text)
            print(format_readability(result))
            
        elif args.command == "add":
            doc_data = {
                "title": args.title,
                "content": args.content,
                "author": args.author,
                "category": args.category,
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            result = run_async(add_document(doc_data))
            print(f"Document added successfully!\n")
            print(format_document(result))
            
        elif args.command == "search":
            results = run_async(search_documents(args.query))
            if not results:
                print(f"No documents found matching '{args.query}'")
            else:
                print(f"Found {len(results)} document(s) matching '{args.query}':\n")
                for doc in results:
                    print(format_document(doc))
                    print("-" * 40)
            
        elif args.command == "list":
            results = run_async(list_documents())
            if not results:
                print("No documents found in the library.")
            else:
                print(f"Document Library ({len(results)} documents):\n")
                for doc in results:
                    print(format_document(doc))
                    print("-" * 40)
            
        elif args.command == "analyze":
            result = run_async(analyze_document(args.document_id))
            if "error" in result:
                print(f"Error: {result['error']}")
                return
                
            print(f"Analysis for document '{result['document']['title']}':\n")
            print(format_document(result['document']))
            print("\nSENTIMENT ANALYSIS:")
            print(format_sentiment(result['sentiment']))
            print("\nKEYWORD EXTRACTION:")
            print(format_keywords(result['keywords']))
            print("\nREADABILITY METRICS:")
            print(format_readability(result['readability']))
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())