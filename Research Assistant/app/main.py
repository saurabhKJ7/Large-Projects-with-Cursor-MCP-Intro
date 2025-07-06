from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid

from .services.pdf import PDFProcessor
from .services.search import SearchService
from .services.synthesis import SynthesisService
from .models.document import Document, SearchResult, WebSearchResult, AnswerResponse

app = FastAPI(title="Research Assistant API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = PDFProcessor()
search_service = SearchService()
synthesis_service = SynthesisService()

# Create upload directory if it doesn't exist
if not os.path.exists("uploads"):
    os.makedirs("uploads")

class QueryRequest(BaseModel):
    query: str
    pdf_only: bool = False
    web_only: bool = False

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)) -> Document:
    """Upload and process a PDF document"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_path = os.path.join("uploads", f"{uuid.uuid4()}.pdf")
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Process PDF
        document = pdf_processor.process_pdf(file_path)
        
        # Add to search indices
        await search_service.add_documents(document.chunks)
        
        return document
    except Exception as e:
        os.remove(file_path)  # Clean up on error
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query(request: QueryRequest) -> AnswerResponse:
    """Query the system using both PDF and web sources"""
    try:
        # Get results from PDF documents
        pdf_results: List[SearchResult] = []
        if not request.web_only:
            pdf_results = await search_service.hybrid_search(request.query)
        
        # Get results from web search
        web_results: List[WebSearchResult] = []
        if not request.pdf_only:
            web_results = await search_service.search_web(request.query)
        
        # Generate answer
        response = await synthesis_service.generate_answer(
            request.query,
            pdf_results,
            web_results
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"} 