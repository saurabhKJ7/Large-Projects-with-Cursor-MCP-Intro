from typing import Dict, List, Any
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
import json
import os
import pandas as pd

from ..embeddings.embedding_factory import EmbeddingFactory

class ArticleClassifier:
    CATEGORIES = ['Tech', 'Finance', 'Healthcare', 'Sports', 'Politics', 'Entertainment']
    
    def __init__(self):
        self.embedding_factory = EmbeddingFactory()
        self.models = {
            'word2vec': LogisticRegression(max_iter=1000),
            'bert': LogisticRegression(max_iter=1000),
            'sbert': LogisticRegression(max_iter=1000),
            'openai': LogisticRegression(max_iter=1000)
        }
        self.metrics = {}
        self.load_data()
        self.train_models()

    def load_data(self):
        """Load and prepare the training data"""
        # For demo purposes, we'll create a small synthetic dataset
        # In production, you would load real data from a file or database
        self.data = []
        self.labels = []
        
        # Load sample data from JSON file if it exists
        data_file = os.path.join(os.path.dirname(__file__), '../../data/sample_articles.json')
        if os.path.exists(data_file):
            with open(data_file, 'r') as f:
                dataset = json.load(f)
                self.data = [item['text'] for item in dataset]
                self.labels = [item['category'] for item in dataset]
        else:
            # Create minimal synthetic dataset for testing
            sample_texts = [
                "Apple announces new iPhone with AI capabilities",
                "Stock market reaches record high as tech stocks surge",
                "New cancer treatment shows promising results",
                "Lakers win championship in dramatic final game",
                "Senate passes new climate change legislation",
                "Latest Marvel movie breaks box office records"
            ]
            self.data = sample_texts
            self.labels = self.CATEGORIES[:len(sample_texts)]

    def train_models(self):
        """Train all embedding models"""
        X_train, X_test, y_train, y_test = train_test_split(
            self.data, self.labels, test_size=0.2, random_state=42
        )

        for model_name in self.models:
            print(f"Training {model_name} model...")
            
            # Get embeddings for training data
            X_train_emb = np.array([
                self.embedding_factory.get_embedding(text, model_name)
                for text in X_train
            ])
            
            # Get embeddings for test data
            X_test_emb = np.array([
                self.embedding_factory.get_embedding(text, model_name)
                for text in X_test
            ])
            
            # Train the model
            self.models[model_name].fit(X_train_emb, y_train)
            
            # Calculate metrics
            y_pred = self.models[model_name].predict(X_test_emb)
            report = classification_report(y_test, y_pred, output_dict=True)
            conf_matrix = confusion_matrix(y_test, y_pred).tolist()
            
            self.metrics[model_name] = {
                'classification_report': report,
                'confusion_matrix': conf_matrix
            }

    def classify(self, text: str) -> Dict[str, Any]:
        """Classify a single article using all models"""
        results = {}
        
        for model_name, model in self.models.items():
            # Get embedding
            embedding = self.embedding_factory.get_embedding(text, model_name)
            
            # Get prediction and probabilities
            prediction = model.predict([embedding])[0]
            probabilities = model.predict_proba([embedding])[0]
            
            # Get confidence scores for all classes
            confidence_scores = {
                category: float(prob)
                for category, prob in zip(self.CATEGORIES, probabilities)
            }
            
            results[model_name] = {
                'prediction': prediction,
                'confidence': float(max(probabilities)),
                'confidence_scores': confidence_scores
            }
        
        return results

    def get_model_metrics(self) -> Dict[str, Any]:
        """Return performance metrics for all models"""
        return self.metrics 