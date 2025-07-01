from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from . import rag_chain, ingest
from .rag_chain import answer_question
from .vector_store import get_document_count

app = FastAPI(title="MCP Chatbot API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class QuestionRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[list[str]] = None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "MCP Chatbot is running"}

@app.get("/status")
async def status():
    """Get the status of the chatbot and document count"""
    doc_count = get_document_count()
    return {
        "status": "ready" if doc_count > 0 else "no_documents",
        "document_count": doc_count
    }

@app.post("/ask", response_model=ChatResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask a question about MCP
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
        
    # Get answer and sources
    answer, sources = answer_question(request.question)
    
    # Convert sources to list if it's a string
    if isinstance(sources, str):
        sources = [line.strip("- ") for line in sources.split("\n") if line.strip("- ")]
    
    return ChatResponse(
        answer=answer,
        sources=sources
    )

@app.post("/ingest")
def ingest_endpoint():
    """
    Triggers data ingestion from URLs and GitHub repos, storing in the vector DB.
    """
    try:
        ingest.run_ingestion()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
