import asyncio
import json
from mcp import Client

async def main():
    # Connect to the document analyzer server
    client = Client("document_analyzer")
    
    print("\n=== Document Analyzer MCP Client Example ===\n")
    
    # Example 1: Analyze sentiment of a text snippet
    print("Example 1: Sentiment Analysis")
    text = "I absolutely love this product! It exceeds all my expectations and I would highly recommend it."
    sentiment_result = await client.get_sentiment(text=text)
    print(f"Text: {text}")
    print(f"Sentiment: {sentiment_result['sentiment']}")
    print(f"Confidence scores: Positive={sentiment_result['positive_score']}, "
          f"Negative={sentiment_result['negative_score']}, "
          f"Neutral={sentiment_result['neutral_score']}")
    print(f"Compound score: {sentiment_result['compound_score']}")
    
    print("\n" + "-"*50 + "\n")
    
    # Example 2: Extract keywords from text
    print("Example 2: Keyword Extraction")
    text = """Artificial intelligence and machine learning are transforming industries across the global economy. 
    Companies are investing heavily in AI research and development to gain competitive advantages."""
    keywords_result = await client.extract_keywords(text=text, limit=5)
    print(f"Text: {text}")
    print("Top 5 keywords:")
    for keyword in keywords_result:
        print(f"  - {keyword['keyword']}: {keyword['score']}")
    
    print("\n" + "-"*50 + "\n")
    
    # Example 3: Add a new document
    print("Example 3: Adding a Document")
    document_data = {
        "title": "The Benefits of Regular Exercise",
        "content": """Regular exercise has numerous benefits for both physical and mental health. 
        Physical activity can help control weight, combat health conditions and diseases, improve mood, 
        boost energy, promote better sleep, and enhance social connections. 
        
        Even modest amounts of exercise can make a significant difference. Research suggests that 
        as little as 30 minutes of moderate exercise five times a week is sufficient to improve 
        cardiovascular health and overall well-being.
        
        Different types of exercise provide different benefits. Aerobic activities like walking, 
        swimming, and cycling improve cardiovascular health, while strength training builds muscle 
        mass and bone density. Flexibility exercises like yoga help maintain range of motion and 
        prevent injuries.
        
        The psychological benefits of exercise are equally important. Physical activity stimulates 
        the release of endorphins, chemicals in the brain that are natural mood elevators. Regular 
        exercise can reduce symptoms of depression and anxiety, improve sleep quality, and enhance 
        cognitive function.
        
        Starting an exercise routine doesn't have to be complicated. Begin with activities you enjoy 
        and gradually increase intensity and duration as your fitness improves. Consistency is more 
        important than intensity, especially when first establishing an exercise habit.""",
        "author": "Dr. Jane Smith",
        "category": "Health",
        "date": "2023-06-15"
    }
    
    add_result = await client.add_document(document_data=document_data)
    print(f"Added document with ID: {add_result['id']}")
    print(f"Title: {add_result['title']}")
    print(f"Author: {add_result['author']}")
    print(f"Category: {add_result['category']}")
    print(f"Date: {add_result['date']}")
    
    # Store the document ID for later use
    document_id = add_result['id']
    
    print("\n" + "-"*50 + "\n")
    
    # Example 4: Analyze the document we just added
    print("Example 4: Full Document Analysis")
    analysis_result = await client.analyze_document(document_id=document_id)
    
    print(f"Document: {analysis_result['document']['title']}")
    print("\nSentiment Analysis:")
    print(f"  - Overall sentiment: {analysis_result['sentiment']['sentiment']}")
    print(f"  - Positive score: {analysis_result['sentiment']['positive_score']}")
    print(f"  - Negative score: {analysis_result['sentiment']['negative_score']}")
    print(f"  - Neutral score: {analysis_result['sentiment']['neutral_score']}")
    
    print("\nTop Keywords:")
    for keyword in analysis_result['keywords'][:5]:  # Show top 5
        print(f"  - {keyword['keyword']}: {keyword['score']}")
    
    print("\nReadability Metrics:")
    print(f"  - Flesch Reading Ease: {analysis_result['readability']['flesch_score']}")
    print(f"  - Grade Level: {analysis_result['readability']['grade_level']}")
    print(f"  - Reading Time: {analysis_result['readability']['reading_time_seconds']} seconds")
    
    print("\nText Statistics:")
    print(f"  - Word Count: {analysis_result['readability']['word_count']}")
    print(f"  - Sentence Count: {analysis_result['readability']['sentence_count']}")
    print(f"  - Paragraph Count: {analysis_result['readability']['paragraph_count']}")
    print(f"  - Unique Word Count: {analysis_result['readability']['unique_word_count']}")
    
    print("\n" + "-"*50 + "\n")
    
    # Example 5: Search for documents
    print("Example 5: Document Search")
    search_results = await client.search_documents(query="exercise")
    print(f"Found {len(search_results)} documents matching 'exercise':")
    for doc in search_results:
        print(f"  - {doc['title']} by {doc['author']} ({doc['date']})")
    
    print("\n" + "-"*50 + "\n")
    
    # Example 6: List all documents
    print("Example 6: List All Documents")
    all_documents = await client.list_documents()
    print(f"Total documents in storage: {len(all_documents)}")
    print("Recent documents:")
    # Show the 3 most recent documents
    for doc in sorted(all_documents, key=lambda x: x.get('added_at', ''), reverse=True)[:3]:
        print(f"  - {doc['title']} by {doc['author']} ({doc['date']})")

if __name__ == "__main__":
    asyncio.run(main())