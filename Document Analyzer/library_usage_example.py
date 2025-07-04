#!/usr/bin/env python3

"""
This example demonstrates how to use the Document Analyzer as a library
in your own Python projects without using the MCP client-server architecture.

This can be useful for integrating the analysis capabilities directly
into your application without the network overhead.
"""

import os
import sys
import asyncio

# Add the current directory to the path so we can import from server.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the analysis functions directly from server.py
from server import (
    get_sentiment,
    extract_keywords,
    calculate_readability,
    add_document,
    search_documents,
    analyze_document,
    list_documents
)

async def main():
    print("\n=== Document Analyzer Library Usage Example ===\n")
    
    # Example 1: Direct sentiment analysis
    print("Example 1: Direct Sentiment Analysis")
    text = "This product is fantastic and exceeded all my expectations!"
    sentiment_result = await get_sentiment(text)
    print(f"Text: {text}")
    print(f"Sentiment: {sentiment_result['sentiment']}")
    print(f"Scores: Positive={sentiment_result['positive_score']}, "
          f"Negative={sentiment_result['negative_score']}, "
          f"Neutral={sentiment_result['neutral_score']}")
    
    print("\n" + "-"*50 + "\n")
    
    # Example 2: Direct keyword extraction
    print("Example 2: Direct Keyword Extraction")
    text = """Python is a powerful programming language that is widely used in web development, 
    data analysis, artificial intelligence, and scientific computing. Its simple syntax 
    and readability make it an excellent choice for beginners."""
    keywords_result = await extract_keywords(text, limit=5)
    print(f"Text: {text}")
    print("Top 5 keywords:")
    for keyword in keywords_result:
        print(f"  - {keyword['keyword']}: {keyword['score']}")
    
    print("\n" + "-"*50 + "\n")
    
    # Example 3: Calculate readability directly
    print("Example 3: Direct Readability Calculation")
    text = """The mitochondrion is a double-membrane-bound organelle found in most eukaryotic organisms. 
    Mitochondria are commonly between 0.75 and 3 μm in diameter but vary considerably in size and structure. 
    They are sometimes described as "the powerhouse of the cell" because they generate most of the cell's 
    supply of adenosine triphosphate (ATP), used as a source of chemical energy."""
    readability_result = calculate_readability(text)
    print(f"Text: {text}")
    print(f"Flesch Reading Ease: {readability_result['flesch_score']}")
    print(f"Grade Level: {readability_result['grade_level']}")
    print(f"Reading Time: {readability_result['reading_time_seconds']} seconds")
    print(f"Word Count: {readability_result['word_count']}")
    print(f"Sentence Count: {readability_result['sentence_count']}")
    print(f"Paragraph Count: {readability_result['paragraph_count']}")
    
    print("\n" + "-"*50 + "\n")
    
    # Example 4: Combining multiple analyses
    print("Example 4: Combined Analysis")
    text = """Climate change is one of the most pressing challenges facing our planet today. 
    Rising global temperatures have led to melting ice caps, rising sea levels, and more 
    frequent extreme weather events. Scientists warn that immediate action is necessary 
    to prevent catastrophic consequences for ecosystems and human societies worldwide."""
    
    # Run analyses in parallel
    sentiment_task = asyncio.create_task(get_sentiment(text))
    keywords_task = asyncio.create_task(extract_keywords(text, limit=5))
    
    # Calculate readability (not async)
    readability = calculate_readability(text)
    
    # Wait for async tasks to complete
    sentiment = await sentiment_task
    keywords = await keywords_task
    
    # Combine results
    combined_analysis = {
        "text": text,
        "sentiment": sentiment,
        "keywords": keywords,
        "readability": readability
    }
    
    # Display results
    print(f"Text: {text}")
    print(f"\nSentiment: {combined_analysis['sentiment']['sentiment']}")
    print(f"Compound Score: {combined_analysis['sentiment']['compound_score']}")
    
    print("\nTop Keywords:")
    for keyword in combined_analysis['keywords']:
        print(f"  - {keyword['keyword']}: {keyword['score']}")
    
    print("\nReadability:")
    print(f"  - Flesch Score: {combined_analysis['readability']['flesch_score']}")
    print(f"  - Grade Level: {combined_analysis['readability']['grade_level']}")
    print(f"  - Reading Time: {combined_analysis['readability']['reading_time_seconds']} seconds")
    
    print("\n" + "-"*50 + "\n")
    
    print("Example 5: Working with Documents")
    # Add a document
    doc_data = {
        "title": "Understanding Machine Learning",
        "content": """Machine learning is a branch of artificial intelligence that focuses on developing 
        systems that can learn from and make decisions based on data. Instead of explicitly 
        programming rules, these systems identify patterns and make predictions with minimal 
        human intervention. Common machine learning approaches include supervised learning, 
        unsupervised learning, and reinforcement learning.""",
        "author": "Alex Johnson",
        "category": "Technology"
    }
    
    # Add the document
    doc = await add_document(doc_data)
    print(f"Added document: {doc['title']} (ID: {doc['id']})")
    
    # Analyze the document
    analysis = await analyze_document(doc['id'])
    print(f"\nDocument Analysis for '{doc['title']}':")
    print(f"  - Sentiment: {analysis['sentiment']['sentiment']}")
    print(f"  - Top Keyword: {analysis['keywords'][0]['keyword']} (score: {analysis['keywords'][0]['score']})")
    print(f"  - Readability: Grade Level {analysis['readability']['grade_level']}, "
          f"Reading Time {analysis['readability']['reading_time_seconds']} seconds")
    
    # Search for documents
    search_results = await search_documents("machine learning")
    print(f"\nFound {len(search_results)} documents matching 'machine learning'")

if __name__ == "__main__":
    asyncio.run(main())