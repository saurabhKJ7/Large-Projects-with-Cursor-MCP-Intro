from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SERPER_API_KEY: str = os.getenv("SERPER_API_KEY", "")
    BING_API_KEY: str = os.getenv("BING_API_KEY", "")
    
    # Search Settings
    DENSE_TOP_K: int = 5
    SPARSE_TOP_K: int = 5
    HYBRID_ALPHA: float = 0.5  # Weight for combining dense and sparse scores
    RERANK_TOP_K: int = 3
    
    # Model Settings
    EMBEDDING_MODEL: str = "text-embedding-3-small"  # or "sentence-transformers/all-MiniLM-L6-v2"
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    LLM_MODEL: str = "gpt-4"  # or "gpt-3.5-turbo"
    
    # PDF Processing
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    
    # Vector Search
    FAISS_INDEX_TYPE: str = "HNSW"  # or "IVFFlat"
    FAISS_METRIC: str = "cosine"
    
    # Web Search
    SEARCH_PROVIDER: str = "serper"  # or "bing"
    WEB_SEARCH_LIMIT: int = 5
    
    # Cache Settings
    CACHE_EMBEDDINGS: bool = True
    CACHE_DIR: str = "cache"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Create settings instance
settings = get_settings() 