from typing import Dict, List
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModel
import torch
import gensim.downloader as api
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

class EmbeddingFactory:
    def __init__(self):
        self.models = {}
        self.initialize_models()

    def initialize_models(self):
        # Initialize Word2Vec
        print("Loading Word2Vec model...")
        self.models['word2vec'] = api.load('word2vec-google-news-300')

        # Initialize BERT
        print("Loading BERT model...")
        self.models['bert_tokenizer'] = AutoTokenizer.from_pretrained('bert-base-uncased')
        self.models['bert_model'] = AutoModel.from_pretrained('bert-base-uncased')

        # Initialize Sentence-BERT
        print("Loading Sentence-BERT model...")
        self.models['sbert'] = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

        # Initialize OpenAI client
        self.models['openai'] = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    def get_word2vec_embedding(self, text: str) -> np.ndarray:
        words = text.lower().split()
        word_vectors = [
            self.models['word2vec'][word]
            for word in words
            if word in self.models['word2vec']
        ]
        if not word_vectors:
            return np.zeros(300)
        return np.mean(word_vectors, axis=0)

    def get_bert_embedding(self, text: str) -> np.ndarray:
        tokenizer = self.models['bert_tokenizer']
        model = self.models['bert_model']
        
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get [CLS] token embedding
        cls_embedding = outputs.last_hidden_state[:, 0, :].numpy()
        return cls_embedding[0]

    def get_sbert_embedding(self, text: str) -> np.ndarray:
        return self.models['sbert'].encode(text)

    def get_openai_embedding(self, text: str) -> np.ndarray:
        response = self.models['openai'].embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return np.array(response.data[0].embedding)

    def get_embedding(self, text: str, model_name: str) -> np.ndarray:
        if model_name == 'word2vec':
            return self.get_word2vec_embedding(text)
        elif model_name == 'bert':
            return self.get_bert_embedding(text)
        elif model_name == 'sbert':
            return self.get_sbert_embedding(text)
        elif model_name == 'openai':
            return self.get_openai_embedding(text)
        else:
            raise ValueError(f"Unknown model: {model_name}")

    def get_all_embeddings(self, text: str) -> Dict[str, np.ndarray]:
        return {
            'word2vec': self.get_word2vec_embedding(text),
            'bert': self.get_bert_embedding(text),
            'sbert': self.get_sbert_embedding(text),
            'openai': self.get_openai_embedding(text)
        } 