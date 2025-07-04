import asyncio
import os
import json
import unittest
from mcp import Client

class TestDocumentAnalyzerServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create data directory if it doesn't exist
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        # Create an empty documents.json file if it doesn't exist
        documents_file = os.path.join(data_dir, "documents.json")
        if not os.path.exists(documents_file):
            with open(documents_file, "w") as f:
                json.dump({}, f)
    
    def setUp(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.client = Client("document_analyzer")
    
    def tearDown(self):
        self.loop.close()
    
    def test_sentiment_analysis(self):
        # Test positive sentiment
        positive_text = "I love this product! It's amazing and exceeded all my expectations."
        result = self.loop.run_until_complete(self.client.get_sentiment(text=positive_text))
        self.assertEqual(result["sentiment"], "positive")
        self.assertGreater(result["positive_score"], result["negative_score"])
        
        # Test negative sentiment
        negative_text = "This is terrible. I'm very disappointed and regret my purchase."
        result = self.loop.run_until_complete(self.client.get_sentiment(text=negative_text))
        self.assertEqual(result["sentiment"], "negative")
        self.assertGreater(result["negative_score"], result["positive_score"])
        
        # Test neutral sentiment
        neutral_text = "The product arrived yesterday. It has several features and comes in a box."
        result = self.loop.run_until_complete(self.client.get_sentiment(text=neutral_text))
        self.assertEqual(result["sentiment"], "neutral")
    
    def test_keyword_extraction(self):
        text = "Artificial intelligence and machine learning are transforming technology industries worldwide."
        result = self.loop.run_until_complete(self.client.extract_keywords(text=text, limit=5))
        
        # Check that we got results
        self.assertIsInstance(result, list)
        self.assertLessEqual(len(result), 5)
        
        # Check structure of results
        if result:  # Only check if we have results
            self.assertIn("keyword", result[0])
            self.assertIn("score", result[0])
            
            # Check that expected keywords are present (case insensitive)
            all_keywords = [item["keyword"].lower() for item in result]
            self.assertTrue(any("artificial" in kw or "intelligence" in kw or "learning" in kw or "technology" in kw for kw in all_keywords))
    
    def test_document_crud(self):
        # Test adding a document
        doc_data = {
            "title": "Test Document",
            "content": "This is a test document for unit testing purposes.",
            "author": "Test Author",
            "category": "Test"
        }
        
        # Add document
        add_result = self.loop.run_until_complete(self.client.add_document(document_data=doc_data))
        self.assertEqual(add_result["title"], "Test Document")
        self.assertIn("id", add_result)
        doc_id = add_result["id"]
        
        # Search for the document
        search_result = self.loop.run_until_complete(self.client.search_documents(query="test document"))
        self.assertGreaterEqual(len(search_result), 1)
        found = False
        for doc in search_result:
            if doc["id"] == doc_id:
                found = True
                break
        self.assertTrue(found, "Added document not found in search results")
        
        # Analyze the document
        analysis = self.loop.run_until_complete(self.client.analyze_document(document_id=doc_id))
        self.assertEqual(analysis["document"]["id"], doc_id)
        self.assertIn("sentiment", analysis)
        self.assertIn("keywords", analysis)
        self.assertIn("readability", analysis)
        
        # List all documents
        all_docs = self.loop.run_until_complete(self.client.list_documents())
        self.assertIsInstance(all_docs, list)
        found = False
        for doc in all_docs:
            if doc["id"] == doc_id:
                found = True
                break
        self.assertTrue(found, "Added document not found in list of all documents")

if __name__ == "__main__":
    print("Running tests for Document Analyzer MCP Server...")
    unittest.main()