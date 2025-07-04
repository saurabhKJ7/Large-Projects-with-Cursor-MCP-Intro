#!/usr/bin/env python3

"""
Batch Processing Example

This script demonstrates how to use the Document Analyzer for batch processing
of multiple documents. It shows how to:

1. Process a directory of text files
2. Generate analysis reports
3. Export results to CSV
"""

import os
import sys
import asyncio
import csv
import glob
import json
from datetime import datetime

# Add the current directory to the path so we can import from server.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the analysis functions directly from server.py
from server import (
    get_sentiment,
    extract_keywords,
    calculate_readability,
    add_document
)

async def process_file(file_path):
    """Process a single text file and return analysis results"""
    try:
        # Read the file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip empty files
        if not content.strip():
            print(f"Skipping empty file: {file_path}")
            return None
        
        # Get file metadata
        filename = os.path.basename(file_path)
        file_title = os.path.splitext(filename)[0].replace('_', ' ').title()
        
        # Run analyses in parallel
        sentiment_task = asyncio.create_task(get_sentiment(content))
        keywords_task = asyncio.create_task(extract_keywords(content, limit=10))
        
        # Calculate readability (not async)
        readability = calculate_readability(content)
        
        # Wait for async tasks to complete
        sentiment = await sentiment_task
        keywords = await keywords_task
        
        # Create document record
        document = {
            "title": file_title,
            "content": content,
            "file_path": file_path,
            "processed_at": datetime.now().isoformat(),
            "sentiment": sentiment,
            "keywords": keywords,
            "readability": readability
        }
        
        # Optionally add to document storage
        doc_data = {
            "title": file_title,
            "content": content,
            "author": "Batch Import",
            "category": "Imported",
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        stored_doc = await add_document(doc_data)
        document["document_id"] = stored_doc["id"]
        
        print(f"Processed: {file_title} - {sentiment['sentiment']} sentiment, "
              f"Flesch score: {readability['flesch_score']:.1f}")
        
        return document
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

async def batch_process_directory(directory, output_dir="./batch_results"):
    """Process all text files in a directory and generate reports"""
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all text files in the directory
    file_paths = glob.glob(os.path.join(directory, "*.txt"))
    
    if not file_paths:
        print(f"No text files found in {directory}")
        return
    
    print(f"Found {len(file_paths)} text files to process")
    
    # Process all files
    tasks = [process_file(file_path) for file_path in file_paths]
    results = await asyncio.gather(*tasks)
    
    # Filter out None results (failed processing)
    results = [r for r in results if r is not None]
    
    if not results:
        print("No files were successfully processed")
        return
    
    # Generate summary report
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save detailed JSON report
    json_path = os.path.join(output_dir, f"analysis_report_{timestamp}.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    # Create CSV summary
    csv_path = os.path.join(output_dir, f"analysis_summary_{timestamp}.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write header
        writer.writerow([
            "Title", "Sentiment", "Positive Score", "Negative Score", "Neutral Score",
            "Top Keyword", "Keyword Score", "Flesch Score", "Grade Level",
            "Reading Time (sec)", "Word Count", "Document ID"
        ])
        
        # Write data rows
        for doc in results:
            top_keyword = doc["keywords"][0] if doc["keywords"] else {"keyword": "", "score": 0}
            
            writer.writerow([
                doc["title"],
                doc["sentiment"]["sentiment"],
                doc["sentiment"]["positive_score"],
                doc["sentiment"]["negative_score"],
                doc["sentiment"]["neutral_score"],
                top_keyword["keyword"],
                top_keyword["score"],
                doc["readability"]["flesch_score"],
                doc["readability"]["grade_level"],
                doc["readability"]["reading_time_seconds"],
                doc["readability"]["word_count"],
                doc.get("document_id", "")
            ])
    
    print(f"\nProcessing complete!")
    print(f"Processed {len(results)} files")
    print(f"Detailed report saved to: {json_path}")
    print(f"Summary CSV saved to: {csv_path}")

def main():
    # Check command line arguments
    if len(sys.argv) < 2:
        print("Usage: python batch_process_example.py <directory_with_text_files> [output_directory]")
        print("\nExample: python batch_process_example.py ./sample_texts ./results")
        return
    
    input_dir = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./batch_results"
    
    if not os.path.isdir(input_dir):
        print(f"Error: {input_dir} is not a valid directory")
        return
    
    # Create sample text directory with example files if it doesn't exist
    if input_dir == "./sample_texts" and not os.path.exists(input_dir):
        print("Creating sample texts directory with example files...")
        os.makedirs(input_dir, exist_ok=True)
        
        # Create some sample text files
        samples = [
            ("positive_review.txt", "This product is amazing! I've been using it for a month and it has exceeded all my expectations. The quality is outstanding and customer service was excellent. Highly recommended to everyone!"),
            ("negative_feedback.txt", "I'm very disappointed with this service. The response time was slow, the staff was unhelpful, and the overall experience was frustrating. I would not recommend this to anyone."),
            ("technical_documentation.txt", "The API uses REST principles and returns JSON responses. Authentication requires an API key passed in the header. Rate limiting is set at 100 requests per minute. Responses use standard HTTP status codes, with 429 indicating rate limit exceeded."),
            ("neutral_news_article.txt", "The city council voted yesterday on the new budget proposal. Six members voted in favor while three opposed. The approved budget allocates funds for infrastructure projects and public services. Implementation will begin next month."),
            ("creative_story.txt", "The old lighthouse stood sentinel on the rocky promontory, its weathered stone facade bearing witness to a century of storms and sunsets. Marina traced her fingers along the spiral staircase as she climbed, feeling the worn grooves left by generations of keepers before her.")
        ]
        
        for filename, content in samples:
            with open(os.path.join(input_dir, filename), 'w', encoding='utf-8') as f:
                f.write(content)
        
        print(f"Created {len(samples)} sample text files in {input_dir}")
    
    # Run the batch processing
    asyncio.run(batch_process_directory(input_dir, output_dir))

if __name__ == "__main__":
    main()