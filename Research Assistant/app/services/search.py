from typing import List, Dict, Tuple
import numpy as np
import faiss
from whoosh.index import create_in, open_dir
from whoosh.fields import Schema, TEXT, ID
from whoosh.qparser import QueryParser
import os
import requests
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from ..core.config import settings
from ..models.document import SearchResult, WebSearchResult
from .embedding import EmbeddingService

class SearchService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.dense_top_k = settings.DENSE_TOP_K
        self.sparse_top_k = settings.SPARSE_TOP_K
        self.hybrid_alpha = settings.HYBRID_ALPHA
        self.rerank_top_k = settings.RERANK_TOP_K
        
        # Initialize FAISS index
        self.index = None
        self.document_map = {}
        
        # Initialize Whoosh
        if not os.path.exists("whoosh_index"):
            os.makedirs("whoosh_index")
        schema = Schema(
            chunk_id=ID(stored=True),
            content=TEXT(stored=True)
        )
        self.whoosh_index = create_in("whoosh_index", schema)
        
        # Initialize re-ranker
        self.reranker = AutoModelForSequenceClassification.from_pretrained(settings.RERANKER_MODEL)
        self.reranker_tokenizer = AutoTokenizer.from_pretrained(settings.RERANKER_MODEL)
        self.reranker.eval()
    
    def _init_faiss_index(self, dim: int):
        """Initialize FAISS index with appropriate parameters"""
        if settings.FAISS_INDEX_TYPE == "HNSW":
            self.index = faiss.IndexHNSWFlat(dim, 32)  # 32 neighbors
        else:  # IVFFlat
            quantizer = faiss.IndexFlatL2(dim)
            self.index = faiss.IndexIVFFlat(quantizer, dim, 100)  # 100 centroids
            self.index.train(np.random.random((1000, dim)).astype('float32'))
    
    async def add_documents(self, chunks: List[Dict]):
        """Add document chunks to both dense and sparse indices"""
        # Add to FAISS
        embeddings = []
        for chunk in chunks:
            if not chunk.embedding:
                chunk.embedding = await self.embedding_service.get_embedding(chunk.text)
            embeddings.append(chunk.embedding)
            self.document_map[chunk.chunk_id] = chunk
        
        embeddings_array = np.array(embeddings).astype('float32')
        if self.index is None:
            self._init_faiss_index(embeddings_array.shape[1])
        self.index.add(embeddings_array)
        
        # Add to Whoosh
        writer = self.whoosh_index.writer()
        for chunk in chunks:
            writer.add_document(
                chunk_id=chunk.chunk_id,
                content=chunk.text
            )
        writer.commit()
    
    async def search_web(self, query: str) -> List[WebSearchResult]:
        """Search the web using configured provider"""
        if settings.SEARCH_PROVIDER == "serper":
            headers = {
                "X-API-KEY": settings.SERPER_API_KEY,
                "Content-Type": "application/json"
            }
            response = requests.post(
                "https://google.serper.dev/search",
                headers=headers,
                json={"q": query, "num": settings.WEB_SEARCH_LIMIT}
            )
            results = response.json().get("organic", [])
            
            return [
                WebSearchResult(
                    title=result["title"],
                    snippet=result["snippet"],
                    url=result["link"],
                    published_date=result.get("date")
                ) for result in results
            ]
        else:  # Bing
            headers = {
                "Ocp-Apim-Subscription-Key": settings.BING_API_KEY
            }
            response = requests.get(
                f"https://api.bing.microsoft.com/v7.0/search?q={query}&count={settings.WEB_SEARCH_LIMIT}",
                headers=headers
            )
            results = response.json().get("webPages", {}).get("value", [])
            
            return [
                WebSearchResult(
                    title=result["name"],
                    snippet=result["snippet"],
                    url=result["url"],
                    published_date=None
                ) for result in results
            ]
    
    def _rerank_results(self, query: str, results: List[SearchResult]) -> List[SearchResult]:
        """Re-rank results using cross-encoder"""
        pairs = [[query, result.text] for result in results]
        features = self.reranker_tokenizer(
            pairs,
            padding=True,
            truncation=True,
            return_tensors="pt",
            max_length=512
        )
        
        with torch.no_grad():
            scores = self.reranker(**features).logits.squeeze()
            scores = torch.sigmoid(scores).numpy()
        
        for result, score in zip(results, scores):
            result.score = float(score)
        
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:self.rerank_top_k]
    
    async def hybrid_search(self, query: str) -> List[SearchResult]:
        """Perform hybrid search combining dense and sparse retrieval"""
        # Dense search with FAISS
        query_embedding = await self.embedding_service.get_embedding(query)
        D, I = self.index.search(
            np.array([query_embedding]).astype('float32'),
            self.dense_top_k
        )
        dense_results = []
        for i, (dist, idx) in enumerate(zip(D[0], I[0])):
            if idx < 0:  # Invalid index
                continue
            chunk = self.document_map[list(self.document_map.keys())[idx]]
            dense_results.append(SearchResult(
                text=chunk.text,
                source_type="pdf",
                source_id=chunk.document_id,
                page_number=chunk.page_number,
                chunk_id=chunk.chunk_id,
                score=1.0 - dist  # Convert distance to similarity score
            ))
        
        # Sparse search with Whoosh
        with self.whoosh_index.searcher() as searcher:
            query_parser = QueryParser("content", self.whoosh_index.schema)
            whoosh_query = query_parser.parse(query)
            results = searcher.search(whoosh_query, limit=self.sparse_top_k)
            
            sparse_results = []
            for result in results:
                chunk = self.document_map[result["chunk_id"]]
                sparse_results.append(SearchResult(
                    text=chunk.text,
                    source_type="pdf",
                    source_id=chunk.document_id,
                    page_number=chunk.page_number,
                    chunk_id=chunk.chunk_id,
                    score=result.score
                ))
        
        # Combine results
        all_results = {}
        for result in dense_results + sparse_results:
            if result.chunk_id not in all_results:
                all_results[result.chunk_id] = result
            else:
                # Combine scores using weighted average
                dense_score = result.score if result in dense_results else 0
                sparse_score = result.score if result in sparse_results else 0
                all_results[result.chunk_id].score = (
                    self.hybrid_alpha * dense_score +
                    (1 - self.hybrid_alpha) * sparse_score
                )
        
        combined_results = list(all_results.values())
        combined_results.sort(key=lambda x: x.score, reverse=True)
        
        # Re-rank top results
        reranked_results = self._rerank_results(query, combined_results)
        
        return reranked_results 