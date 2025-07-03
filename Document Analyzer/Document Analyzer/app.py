import nltk
from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
from textstat import flesch_reading_ease, gunning_fog, spache_readability, coleman_liau_index, automated_readability_index, dale_chall_readability_score, linsear_write_formula
import re
from collections import Counter
from sample_documents import sample_docs


app = Flask(__name__)
CORS(app)



# In-memory document storage (for demonstration purposes)
documents = {}
document_id_counter = 0

# Load sample documents
for doc_data in sample_docs:
    document_id_counter += 1
    documents[document_id_counter] = {
        "content": doc_data['content'],
        "metadata": doc_data['metadata']
    }

def analyze_text(text):
    # Sentiment Analysis
    sentiment_analysis = TextBlob(text).sentiment
    sentiment = {
        "polarity": sentiment_analysis.polarity,
        "subjectivity": sentiment_analysis.subjectivity,
        "overall_sentiment": "positive" if sentiment_analysis.polarity > 0 else "negative" if sentiment_analysis.polarity < 0 else "neutral"
    }

    # Keyword Extraction
    words = TextBlob(text).words
    words = [word.lower() for word in words if word.isalpha()]
    # Using a basic list of stopwords as NLTK data is not available
    stopwords = set(["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"])
    filtered_words = [word for word in words if word not in stopwords]
    fdist = Counter(filtered_words)
    keywords = [word for word, freq in fdist.most_common(5)]

    # Readability Scoring
    readability_scores = {
        "flesch_reading_ease": flesch_reading_ease(text),
        "gunning_fog": gunning_fog(text),
        "spache_readability": spache_readability(text),
        "coleman_liau_index": coleman_liau_index(text),
        "automated_readability_index": automated_readability_index(text),
        "dale_chall_readability_score": dale_chall_readability_score(text),
        "linsear_write_formula": linsear_write_formula(text),

    }

    # Basic Stats
    word_count = len(words)
    sentences = TextBlob(text).sentences
    sentence_count = len(sentences)

    return {
        "sentiment": sentiment,
        "keywords": keywords,
        "readability": readability_scores,
        "stats": {
            "word_count": word_count,
            "sentence_count": sentence_count
        }
    }

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "Welcome to the Document Analyzer API!",
        "available_endpoints": {
            "add_document": "/add_document (POST)",
            "analyze_document": "/analyze_document/<document_id> (GET)",
            "get_sentiment": "/get_sentiment/<document_id> (GET)",
            "extract_keywords": "/extract_keywords/<document_id> (GET)",
            "search_documents": "/search_documents?query=<query> (GET)"
        }
    })

@app.route('/frontend')
def serve_frontend():
    from flask import send_from_directory
    return send_from_directory('.', 'index.html')

@app.route('/analyze_document/<int:document_id>', methods=['GET'])
def analyze_document_route(document_id):
    document = documents.get(document_id)
    if not document:
        return jsonify({"error": "Document not found"}), 404
    
    analysis_results = analyze_text(document['content'])
    return jsonify({"document_id": document_id, "metadata": document['metadata'], "analysis": analysis_results})

@app.route('/get_sentiment', methods=['POST'])
def get_sentiment_route():
    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({"error": "Text not provided"}), 400
    
    sentiment_analysis = TextBlob(text).sentiment
    sentiment = {
        "polarity": sentiment_analysis.polarity,
        "subjectivity": sentiment_analysis.subjectivity,
        "overall_sentiment": "positive" if sentiment_analysis.polarity > 0 else "negative" if sentiment_analysis.polarity < 0 else "neutral"
    }
    return jsonify(sentiment)

@app.route('/extract_keywords', methods=['POST'])
def extract_keywords_route():
    data = request.get_json()
    text = data.get('text')
    limit = data.get('limit', 5)
    if not text:
        return jsonify({"error": "Text not provided"}), 400
    
    words = TextBlob(text).words
    words = [word.lower() for word in words if word.isalpha()]
    stopwords = set(["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"])
    filtered_words = [word for word in words if word not in stopwords]
    fdist = Counter(filtered_words)
    keywords = [word for word, freq in fdist.most_common(limit)]
    return jsonify({"keywords": keywords})

@app.route('/add_document', methods=['POST'])
def add_document_route():
    global document_id_counter
    data = request.get_json()
    content = data.get('content')
    metadata = data.get('metadata', {})

    if not content:
        return jsonify({"error": "Document content not provided"}), 400
    
    document_id_counter += 1
    documents[document_id_counter] = {
        "content": content,
        "metadata": metadata
    }
    return jsonify({"message": "Document added successfully", "document_id": document_id_counter}), 201

@app.route('/search_documents', methods=['POST'])
def search_documents_route():
    query = request.get_json().get('query', '')
    if not query:
        return jsonify({"error": "Search query not provided"}), 400
    
    results = []
    for doc_id, doc in documents.items():
        if re.search(query, doc['content'], re.IGNORECASE):
            results.append({"document_id": doc_id, "metadata": doc['metadata'], "content_preview": doc['content'][:200] + "..."})
    
    return jsonify({"results": results})

if __name__ == '__main__':
    app.run(debug=True)