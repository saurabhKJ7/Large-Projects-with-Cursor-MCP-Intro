from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class DocumentChunk(BaseModel):
    """Represents a chunk of text from a document with metadata"""
    text: str
    page_number: int
    chunk_id: str
    document_id: str
    embedding: Optional[List[float]] = None
    metadata: Dict = {}

class Document(BaseModel):
    """Represents a processed document with metadata"""
    document_id: str
    title: str
    content: str
    chunks: List[DocumentChunk]
    total_pages: int
    file_path: str
    file_type: str
    processed_at: datetime = datetime.now()
    metadata: Dict = {}

class SearchResult(BaseModel):
    """Represents a search result with source and relevance information"""
    text: str
    source_type: str  # "pdf" or "web"
    source_id: str  # document_id for PDFs, URL for web results
    page_number: Optional[int] = None  # for PDF results
    chunk_id: Optional[str] = None
    score: float
    metadata: Dict = {}

class WebSearchResult(BaseModel):
    """Represents a result from web search"""
    title: str
    snippet: str
    url: str
    published_date: Optional[str]
    score: Optional[float] = None

class AnswerResponse(BaseModel):
    """Represents the final synthesized answer with citations"""
    answer: str
    sources: List[Dict[str, str]]  # List of citations
    pdf_sources_used: int = 0
    web_sources_used: int = 0
    confidence_score: float 