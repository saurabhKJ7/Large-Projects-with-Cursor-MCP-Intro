#!/usr/bin/env python3

"""
Web Application Example

This script demonstrates how to integrate the Document Analyzer with a web application
using Flask. It provides a simple web interface for text analysis.

Requires additional dependencies:
    pip install flask
"""

import os
import sys
import asyncio
import json
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
    list_documents
)

try:
    from flask import Flask, request, jsonify, render_template, Response
except ImportError:
    print("Flask is required for this example. Install with: pip install flask")
    sys.exit(1)

app = Flask(__name__)

# Create templates directory and HTML template if they don't exist
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates"), exist_ok=True)

# Create HTML template
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates", "index.html"), "w") as f:
    f.write("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Analyzer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .tab {
            overflow: hidden;
            border: 1px solid #ccc;
            background-color: #f1f1f1;
            border-radius: 5px 5px 0 0;
        }
        .tab button {
            background-color: inherit;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 14px 16px;
            transition: 0.3s;
            font-size: 16px;
        }
        .tab button:hover {
            background-color: #ddd;
        }
        .tab button.active {
            background-color: #3498db;
            color: white;
        }
        .tabcontent {
            display: none;
            padding: 20px;
            border: 1px solid #ccc;
            border-top: none;
            border-radius: 0 0 5px 5px;
            animation: fadeEffect 1s;
        }
        @keyframes fadeEffect {
            from {opacity: 0;}
            to {opacity: 1;}
        }
        textarea {
            width: 100%;
            height: 200px;
            padding: 12px 20px;
            box-sizing: border-box;
            border: 2px solid #ccc;
            border-radius: 4px;
            background-color: #f8f8f8;
            resize: vertical;
            font-size: 16px;
            margin-bottom: 20px;
        }
        button {
            background-color: #3498db;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #2980b9;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            background-color: #f9f9f9;
            border-left: 5px solid #3498db;
        }
        .result h3 {
            margin-top: 0;
            color: #3498db;
        }
        .sentiment {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            margin-right: 10px;
        }
        .positive {
            background-color: #2ecc71;
            color: white;
        }
        .negative {
            background-color: #e74c3c;
            color: white;
        }
        .neutral {
            background-color: #95a5a6;
            color: white;
        }
        .keyword-tag {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            margin: 5px;
            font-size: 14px;
        }
        .score {
            font-size: 12px;
            opacity: 0.8;
        }
        .document-card {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
        }
        .document-card h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .document-meta {
            color: #7f8c8d;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .search-box {
            width: 100%;
            padding: 12px 20px;
            margin: 8px 0 20px 0;
            box-sizing: border-box;
            border: 2px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
        }
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        .spinner {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <h1>Document Analyzer</h1>
    
    <div class="tab">
        <button class="tablinks active" onclick="openTab(event, 'TextAnalysis')">Text Analysis</button>
        <button class="tablinks" onclick="openTab(event, 'Documents')">Documents</button>
        <button class="tablinks" onclick="openTab(event, 'AddDocument')">Add Document</button>
    </div>
    
    <div id="TextAnalysis" class="tabcontent" style="display: block;">
        <h2>Text Analysis</h2>
        <p>Enter text to analyze sentiment, extract keywords, and calculate readability metrics.</p>
        
        <textarea id="analysisText" placeholder="Enter text to analyze..."></textarea>
        <button onclick="analyzeText()">Analyze Text</button>
        
        <div class="loading" id="analysisLoading">
            <div class="spinner"></div>
            <p>Analyzing text...</p>
        </div>
        
        <div id="analysisResult" class="result" style="display: none;">
            <h3>Analysis Results</h3>
            <div id="sentimentResult"></div>
            <div id="keywordsResult"></div>
            <div id="readabilityResult"></div>
        </div>
    </div>
    
    <div id="Documents" class="tabcontent">
        <h2>Document Library</h2>
        <input type="text" id="searchQuery" class="search-box" placeholder="Search documents..." onkeyup="if(event.key==='Enter') searchDocuments()">
        <button onclick="searchDocuments()">Search</button>
        <button onclick="listAllDocuments()">List All</button>
        
        <div class="loading" id="documentsLoading">
            <div class="spinner"></div>
            <p>Loading documents...</p>
        </div>
        
        <div id="documentsResult"></div>
    </div>
    
    <div id="AddDocument" class="tabcontent">
        <h2>Add New Document</h2>
        <p>Add a new document to the library with metadata.</p>
        
        <div>
            <label for="docTitle">Title:</label>
            <input type="text" id="docTitle" class="search-box" placeholder="Document title">
        </div>
        
        <div>
            <label for="docAuthor">Author:</label>
            <input type="text" id="docAuthor" class="search-box" placeholder="Author name">
        </div>
        
        <div>
            <label for="docCategory">Category:</label>
            <input type="text" id="docCategory" class="search-box" placeholder="Document category">
        </div>
        
        <div>
            <label for="docContent">Content:</label>
            <textarea id="docContent" placeholder="Document content..."></textarea>
        </div>
        
        <button onclick="addDocument()">Add Document</button>
        
        <div class="loading" id="addDocLoading">
            <div class="spinner"></div>
            <p>Adding document...</p>
        </div>
        
        <div id="addDocResult" class="result" style="display: none;"></div>
    </div>
    
    <script>
        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
            
            // Load documents when switching to Documents tab
            if (tabName === "Documents") {
                listAllDocuments();
            }
        }
        
        async function analyzeText() {
            const text = document.getElementById("analysisText").value.trim();
            if (!text) {
                alert("Please enter some text to analyze.");
                return;
            }
            
            document.getElementById("analysisLoading").style.display = "block";
            document.getElementById("analysisResult").style.display = "none";
            
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text }),
                });
                
                const result = await response.json();
                
                // Display sentiment
                let sentimentClass = "neutral";
                if (result.sentiment.sentiment === "positive") sentimentClass = "positive";
                if (result.sentiment.sentiment === "negative") sentimentClass = "negative";
                
                document.getElementById("sentimentResult").innerHTML = `
                    <h4>Sentiment</h4>
                    <p><span class="sentiment ${sentimentClass}">${result.sentiment.sentiment}</span>
                    Confidence: Positive ${(result.sentiment.positive_score * 100).toFixed(1)}%, 
                    Negative ${(result.sentiment.negative_score * 100).toFixed(1)}%, 
                    Neutral ${(result.sentiment.neutral_score * 100).toFixed(1)}%</p>
                `;
                
                // Display keywords
                let keywordsHtml = "<h4>Top Keywords</h4><div>";
                result.keywords.forEach(kw => {
                    keywordsHtml += `<span class="keyword-tag">${kw.keyword} <span class="score">${kw.score.toFixed(3)}</span></span>`;
                });
                keywordsHtml += "</div>";
                document.getElementById("keywordsResult").innerHTML = keywordsHtml;
                
                // Display readability
                document.getElementById("readabilityResult").innerHTML = `
                    <h4>Readability & Statistics</h4>
                    <p>Flesch Reading Ease: <strong>${result.readability.flesch_score.toFixed(1)}</strong> 
                    (${getFleschDescription(result.readability.flesch_score)})</p>
                    <p>Grade Level: <strong>${result.readability.grade_level.toFixed(1)}</strong></p>
                    <p>Reading Time: <strong>${formatReadingTime(result.readability.reading_time_seconds)}</strong></p>
                    <p>Word Count: <strong>${result.readability.word_count}</strong> words, 
                    <strong>${result.readability.sentence_count}</strong> sentences, 
                    <strong>${result.readability.paragraph_count}</strong> paragraphs</p>
                    <p>Unique Words: <strong>${result.readability.unique_word_count}</strong> 
                    (${(result.readability.unique_word_count / result.readability.word_count * 100).toFixed(1)}% of total)</p>
                `;
                
                document.getElementById("analysisResult").style.display = "block";
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during analysis. Please try again.');
            } finally {
                document.getElementById("analysisLoading").style.display = "none";
            }
        }
        
        async function searchDocuments() {
            const query = document.getElementById("searchQuery").value.trim();
            if (!query) {
                listAllDocuments();
                return;
            }
            
            document.getElementById("documentsLoading").style.display = "block";
            document.getElementById("documentsResult").innerHTML = "";
            
            try {
                const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
                const documents = await response.json();
                
                displayDocuments(documents);
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while searching documents. Please try again.');
            } finally {
                document.getElementById("documentsLoading").style.display = "none";
            }
        }
        
        async function listAllDocuments() {
            document.getElementById("documentsLoading").style.display = "block";
            document.getElementById("documentsResult").innerHTML = "";
            
            try {
                const response = await fetch('/api/documents');
                const documents = await response.json();
                
                displayDocuments(documents);
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while loading documents. Please try again.');
            } finally {
                document.getElementById("documentsLoading").style.display = "none";
            }
        }
        
        function displayDocuments(documents) {
            const container = document.getElementById("documentsResult");
            
            if (documents.length === 0) {
                container.innerHTML = "<p>No documents found.</p>";
                return;
            }
            
            let html = `<h3>Found ${documents.length} document(s)</h3>`;
            
            documents.forEach(doc => {
                html += `
                    <div class="document-card">
                        <h3>${doc.title}</h3>
                        <div class="document-meta">
                            <p>Author: ${doc.author} | Category: ${doc.category} | Date: ${doc.date}</p>
                            <p>Word Count: ${doc.word_count || 'N/A'}</p>
                        </div>
                        <button onclick="viewDocument('${doc.id}')">View Analysis</button>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
        
        async function viewDocument(id) {
            document.getElementById("documentsLoading").style.display = "block";
            
            try {
                const response = await fetch(`/api/document/${id}`);
                const analysis = await response.json();
                
                // Switch to analysis tab and populate with document content
                document.getElementById("analysisText").value = analysis.document.content;
                
                // Trigger analysis
                analyzeText();
                
                // Switch to analysis tab
                document.querySelector('.tablinks[onclick="openTab(event, \'TextAnalysis\')"]').click();
                
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while loading the document. Please try again.');
            } finally {
                document.getElementById("documentsLoading").style.display = "none";
            }
        }
        
        async function addDocument() {
            const title = document.getElementById("docTitle").value.trim();
            const author = document.getElementById("docAuthor").value.trim();
            const category = document.getElementById("docCategory").value.trim();
            const content = document.getElementById("docContent").value.trim();
            
            if (!title) {
                alert("Please enter a document title.");
                return;
            }
            
            if (!content) {
                alert("Please enter document content.");
                return;
            }
            
            document.getElementById("addDocLoading").style.display = "block";
            document.getElementById("addDocResult").style.display = "none";
            
            try {
                const response = await fetch('/api/document', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title,
                        author: author || "Unknown",
                        category: category || "Uncategorized",
                        content
                    }),
                });
                
                const result = await response.json();
                
                document.getElementById("addDocResult").innerHTML = `
                    <h3>Document Added Successfully</h3>
                    <p><strong>Title:</strong> ${result.title}</p>
                    <p><strong>ID:</strong> ${result.id}</p>
                    <p><strong>Author:</strong> ${result.author}</p>
                    <p><strong>Category:</strong> ${result.category}</p>
                    <p><strong>Date:</strong> ${result.date}</p>
                `;
                document.getElementById("addDocResult").style.display = "block";
                
                // Clear form
                document.getElementById("docTitle").value = "";
                document.getElementById("docAuthor").value = "";
                document.getElementById("docCategory").value = "";
                document.getElementById("docContent").value = "";
                
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while adding the document. Please try again.');
            } finally {
                document.getElementById("addDocLoading").style.display = "none";
            }
        }
        
        function getFleschDescription(score) {
            if (score >= 90) return "Very Easy";
            if (score >= 80) return "Easy";
            if (score >= 70) return "Fairly Easy";
            if (score >= 60) return "Standard";
            if (score >= 50) return "Fairly Difficult";
            if (score >= 30) return "Difficult";
            return "Very Difficult";
        }
        
        function formatReadingTime(seconds) {
            if (seconds < 60) return `${Math.round(seconds)} seconds`;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return `${minutes} min ${remainingSeconds} sec`;
        }
    </script>
</body>
</html>
    """)

# Create a bridge between asyncio and Flask
def run_async(func):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(func)
    loop.close()
    return result

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    # Run all analyses
    sentiment = run_async(get_sentiment(text))
    keywords = run_async(extract_keywords(text, limit=10))
    readability = calculate_readability(text)
    
    return jsonify({
        'sentiment': sentiment,
        'keywords': keywords,
        'readability': readability
    })

@app.route('/api/documents', methods=['GET'])
def get_documents():
    documents = run_async(list_documents())
    return jsonify(documents)

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('query', '')
    if not query:
        return jsonify([]), 400
    
    results = run_async(search_documents(query))
    return jsonify(results)

@app.route('/api/document/<document_id>', methods=['GET'])
def get_document(document_id):
    try:
        result = run_async(analyze_document(document_id))
        if 'error' in result:
            return jsonify({'error': result['error']}), 404
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/document', methods=['POST'])
def add_new_document():
    data = request.json
    if not data or not data.get('content') or not data.get('title'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    result = run_async(add_document(data))
    return jsonify(result)

if __name__ == '__main__':
    print("\n=== Document Analyzer Web App ===\n")
    print("Starting web server at http://127.0.0.1:5000")
    print("Press Ctrl+C to stop the server")
    app.run(debug=True)