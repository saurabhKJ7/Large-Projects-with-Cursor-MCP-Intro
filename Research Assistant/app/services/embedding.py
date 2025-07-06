from typing import List, Dict, Union
import numpy as np
import os
import json
import hashlib
from sentence_transformers import SentenceTransformer
import openai
from ..core.config import settings
from ..models.document import DocumentChunk

class EmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.cache_dir = settings.CACHE_DIR
        self.use_cache = settings.CACHE_EMBEDDINGS
        
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
            
        if "sentence-transformers" in self.model_name:
            self.model = SentenceTransformer(self.model_name)
            self.is_openai = False
        else:
            openai.api_key = settings.OPENAI_API_KEY
            self.is_openai = True
    
    def _get_cache_path(self, text: str) -> str:
        """Get cache file path for text"""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        return os.path.join(self.cache_dir, f"{text_hash}.json")
    
    def _load_from_cache(self, text: str) -> Union[List[float], None]:
        """Load embedding from cache if exists"""
        if not self.use_cache:
            return None
            
        cache_path = self._get_cache_path(text)
        if os.path.exists(cache_path):
            with open(cache_path, 'r') as f:
                return json.load(f)
        return None
    
    def _save_to_cache(self, text: str, embedding: List[float]):
        """Save embedding to cache"""
        if not self.use_cache:
            return
            
        cache_path = self._get_cache_path(text)
        with open(cache_path, 'w') as f:
            json.dump(embedding, f)
    
    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using selected model"""
        # Try loading from cache first
        cached_embedding = self._load_from_cache(text)
        if cached_embedding is not None:
            return cached_embedding
        
        if self.is_openai:
            # Use OpenAI embeddings
            response = await openai.embeddings.create(
                model=self.model_name,
                input=text
            )
            embedding = response.data[0].embedding
        else:
            # Use sentence-transformers
            embedding = self.model.encode(text).tolist()
        
        # Cache the result
        self._save_to_cache(text, embedding)
        return embedding
    
    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for multiple texts in batch"""
        embeddings = []
        for text in texts:
            embedding = await self.get_embedding(text)
            embeddings.append(embedding)
        return embeddings
    
    async def embed_chunks(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        """Add embeddings to document chunks"""
        for chunk in chunks:
            if chunk.embedding is None:
                chunk.embedding = await self.get_embedding(chunk.text)
        return chunks 