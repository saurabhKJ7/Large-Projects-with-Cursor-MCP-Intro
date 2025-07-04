import os
import os
import json
import time
from typing import Dict, List, Optional, Union
from datetime import datetime

import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer

from mcp.server.fastmcp import FastMCP

# Initialize NLTK resources
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

# Initialize server
server = FastMCP("document_analyzer")

# Data storage
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Utility functions
def load_documents() -> Dict[str, Dict]:
    """Load all documents from storage"""
    documents = {}
    if not os.path.exists(os.path.join(DATA_DIR, "documents.json")):
        with open(os.path.join(DATA_DIR, "documents.json"), "w") as f:
            json.dump({}, f)
        return {}
    
    with open(os.path.join(DATA_DIR, "documents.json"), "r") as f:
        documents = json.load(f)
    return documents

def save_documents(documents: Dict[str, Dict]) -> None:
    """Save documents to storage"""
    with open(os.path.join(DATA_DIR, "documents.json"), "w") as f:
        json.dump(documents, f, indent=2)

def calculate_readability(text: str) -> Dict[str, Union[float, int]]:
    """Calculate readability metrics for text"""
    sentences = sent_tokenize(text)
    words = word_tokenize(text)
    
    # Filter out punctuation
    words = [word for word in words if word.isalnum()]
    
    if not sentences or not words:
        return {
            "flesch_score": 0,
            "grade_level": 0,
            "reading_time_seconds": 0,
            "word_count": 0,
            "sentence_count": 0,
            "paragraph_count": 0,
            "unique_word_count": 0
        }
    
    # Count paragraphs (approximation by double newlines)
    paragraphs = text.split("\n\n")
    paragraphs = [p for p in paragraphs if p.strip()]
    
    # Calculate Flesch Reading Ease score
    # Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    # Simplified approximation for syllables: count vowel groups per word
    total_syllables = 0
    for word in words:
        vowels = "aeiouy"
        word = word.lower()
        count = 0
        prev_is_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel
            
        if word.endswith('e'):
            count -= 1
        if count == 0:
            count = 1
            
        total_syllables += count
    
    words_per_sentence = len(words) / len(sentences)
    syllables_per_word = total_syllables / len(words)
    
    flesch_score = 206.835 - (1.015 * words_per_sentence) - (84.6 * syllables_per_word)
    flesch_score = max(0, min(100, flesch_score))  # Clamp between 0-100
    
    # Grade level (Flesch-Kincaid)
    grade_level = 0.39 * words_per_sentence + 11.8 * syllables_per_word - 15.59
    grade_level = max(0, grade_level)  # Ensure non-negative
    
    # Reading time (average 200-250 words per minute)
    reading_time_seconds = (len(words) / 225) * 60
    
    return {
        "flesch_score": round(flesch_score, 2),
        "grade_level": round(grade_level, 2),
        "reading_time_seconds": round(reading_time_seconds, 2),
        "word_count": len(words),
        "sentence_count": len(sentences),
        "paragraph_count": len(paragraphs),
        "unique_word_count": len(set(word.lower() for word in words))
    }

# MCP Tool functions
@server.tool()
async def analyze_document(document_id: str) -> Dict:
    """Perform full analysis of a stored document
    
    Args:
        document_id: The ID of the document to analyze
        
    Returns:
        A dictionary containing the document and its analysis
    """
    documents = load_documents()
    
    if document_id not in documents:
        return {"error": f"Document with ID {document_id} not found"}
    
    document = documents[document_id]
    text = document["content"]
    
    # Perform all analyses
    sentiment_result = await get_sentiment(text)
    keywords_result = await extract_keywords(text)
    readability_result = calculate_readability(text)
    
    # Combine results
    analysis = {
        "document": document,
        "sentiment": sentiment_result,
        "keywords": keywords_result,
        "readability": readability_result
    }
    
    return analysis

@server.tool()
async def get_sentiment(text: str) -> Dict[str, Union[str, float]]:
    """Analyze sentiment of provided text
    
    Args:
        text: The text to analyze
        
    Returns:
        A dictionary with sentiment classification and confidence scores
    """
    if not text.strip():
        return {
            "sentiment": "neutral",
            "positive_score": 0.0,
            "negative_score": 0.0,
            "neutral_score": 1.0,
            "compound_score": 0.0
        }
    
    # Use NLTK's VADER for sentiment analysis
    sia = SentimentIntensityAnalyzer()
    scores = sia.polarity_scores(text)
    
    # Determine overall sentiment
    if scores["compound"] >= 0.05:
        sentiment = "positive"
    elif scores["compound"] <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    return {
        "sentiment": sentiment,
        "positive_score": round(scores["pos"], 3),
        "negative_score": round(scores["neg"], 3),
        "neutral_score": round(scores["neu"], 3),
        "compound_score": round(scores["compound"], 3)
    }

@server.tool()
async def extract_keywords(text: str, limit: int = 10) -> List[Dict[str, Union[str, float]]]:
    """Extract top keywords from text using TF-IDF
    
    Args:
        text: The text to analyze
        limit: Maximum number of keywords to return (default: 10)
        
    Returns:
        A list of dictionaries with keywords and their scores
    """
    if not text.strip():
        return []
    
    # Tokenize and preprocess
    stop_words = set(stopwords.words('english'))
    stemmer = PorterStemmer()
    
    # Tokenize and filter words
    words = word_tokenize(text.lower())
    filtered_words = [stemmer.stem(word) for word in words 
                     if word.isalnum() and word not in stop_words]
    
    if not filtered_words:
        return []
    
    # If we have very little text, return the most common words
    if len(filtered_words) < 10:
        word_freq = {}
        for word in filtered_words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [
            {"keyword": word, "score": round(count / len(filtered_words), 3)}
            for word, count in sorted_words[:limit]
        ]
    
    # Use TF-IDF for keyword extraction
    # We need a corpus, so we'll split the text into sentences
    sentences = sent_tokenize(text)
    
    # Handle case with only one sentence
    if len(sentences) == 1:
        # Split into artificial chunks
        words_list = words
        chunk_size = max(5, len(words_list) // 5)
        sentences = [' '.join(words_list[i:i+chunk_size]) 
                    for i in range(0, len(words_list), chunk_size)]
    
    # Apply TF-IDF
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(sentences)
    
    # Get feature names and their scores
    feature_names = vectorizer.get_feature_names_out()
    
    # Calculate average TF-IDF score for each term across all sentences
    tfidf_scores = {}
    for i in range(len(sentences)):
        feature_index = tfidf_matrix[i, :].nonzero()[1]
        tfidf_scores_i = zip(feature_index, [tfidf_matrix[i, x] for x in feature_index])
        
        for idx, score in tfidf_scores_i:
            term = feature_names[idx]
            tfidf_scores[term] = tfidf_scores.get(term, 0) + score
    
    # Average the scores and sort
    for term in tfidf_scores:
        tfidf_scores[term] /= len(sentences)
    
    sorted_terms = sorted(tfidf_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Return top keywords with scores
    return [
        {"keyword": term, "score": round(float(score), 3)}
        for term, score in sorted_terms[:limit]
    ]

@server.tool()
async def add_document(document_data: Dict) -> Dict:
    """Store a new document with metadata
    
    Args:
        document_data: Dictionary containing document content and metadata
            Required fields: content, title
            Optional fields: author, date, category
            
    Returns:
        The stored document with its assigned ID
    """
    # Validate required fields
    if "content" not in document_data or not document_data["content"].strip():
        return {"error": "Document content is required"}
    
    if "title" not in document_data or not document_data["title"].strip():
        return {"error": "Document title is required"}
    
    # Load existing documents
    documents = load_documents()
    
    # Generate a unique ID
    document_id = f"doc_{int(time.time())}_{len(documents) + 1}"
    
    # Prepare document with metadata
    document = {
        "id": document_id,
        "title": document_data["title"],
        "content": document_data["content"],
        "author": document_data.get("author", "Unknown"),
        "date": document_data.get("date", datetime.now().isoformat()[:10]),
        "category": document_data.get("category", "Uncategorized"),
        "added_at": datetime.now().isoformat()
    }
    
    # Store the document
    documents[document_id] = document
    save_documents(documents)
    
    return document

@server.tool()
async def search_documents(query: str) -> List[Dict]:
    """Search documents by content or metadata
    
    Args:
        query: The search query string
        
    Returns:
        A list of matching documents
    """
    if not query.strip():
        return []
    
    documents = load_documents()
    results = []
    
    query = query.lower()
    
    for doc_id, document in documents.items():
        # Search in content
        if query in document["content"].lower():
            results.append(document)
            continue
            
        # Search in metadata
        if query in document["title"].lower():
            results.append(document)
            continue
            
        if query in document.get("author", "").lower():
            results.append(document)
            continue
            
        if query in document.get("category", "").lower():
            results.append(document)
            continue
    
    return results

@server.tool()
async def list_documents() -> List[Dict]:
    """List all stored documents with basic metadata
    
    Returns:
        A list of all documents with their metadata (without content)
    """
    documents = load_documents()
    
    # Return documents without the full content to keep response size manageable
    return [
        {
            "id": doc["id"],
            "title": doc["title"],
            "author": doc.get("author", "Unknown"),
            "date": doc.get("date", ""),
            "category": doc.get("category", "Uncategorized"),
            "added_at": doc.get("added_at", ""),
            "word_count": len(word_tokenize(doc["content"])) if doc["content"] else 0
        }
        for doc in documents.values()
    ]

# Run the server
if __name__ == "__main__":
    print("Document Analyzer MCP Server is running...")
    print(f"Data directory: {DATA_DIR}")
    server.run()