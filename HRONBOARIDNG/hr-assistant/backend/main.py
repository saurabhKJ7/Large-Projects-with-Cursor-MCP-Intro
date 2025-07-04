from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form, Body
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import json
from datetime import datetime

# Import local modules
from ingest import process_document
from rag_pipeline import generate_response
from vector_store import get_document_list, delete_document

app = FastAPI(title="HR Onboarding Knowledge Assistant")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Models
class QueryRequest(BaseModel):
    query: str
    chat_history: Optional[List[Dict[str, str]]] = []

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

class DocumentResponse(BaseModel):
    id: str
    filename: str
    upload_date: str
    categories: List[str]

@app.get("/")
def read_root():
    return {"message": "HR Onboarding Knowledge Assistant API"}

@app.post("/upload", response_model=Dict[str, Any])
async def upload_document(file: UploadFile = File(...)):
    try:
        # Generate a unique ID for the document
        doc_id = str(uuid.uuid4())
        
        # Save the uploaded file
        file_extension = os.path.splitext(file.filename)[1]
        saved_path = f"uploads/{doc_id}{file_extension}"
        
        with open(saved_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process the document (extract text, chunk, embed, store)
        result = process_document(saved_path, file.filename, doc_id)
        
        return {
            "success": True,
            "message": "Document uploaded and processed successfully",
            "document_id": doc_id,
            "filename": file.filename,
            "categories": result.get("categories", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    try:
        # Generate response using RAG pipeline
        response = generate_response(request.query, request.chat_history)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/docs", response_model=List[DocumentResponse])
async def list_documents():
    try:
        documents = get_document_list()
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/admin/docs/{doc_id}")
async def remove_document(doc_id: str):
    try:
        success = delete_document(doc_id)
        if success:
            return {"success": True, "message": "Document deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)