import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

# Import local modules
from utils.parser import extract_text_from_file
from utils.chunker import chunk_text
from vector_store import store_document_chunks, add_document_metadata
from categorize import categorize_document

def process_document(file_path: str, original_filename: str, doc_id: str) -> Dict[str, Any]:
    """
    Process an uploaded document: extract text, chunk it, categorize it,
    create embeddings, and store in vector database
    
    Args:
        file_path: Path to the saved document
        original_filename: Original filename of the document
        doc_id: Unique ID for the document
        
    Returns:
        Dict with processing results
    """
    try:
        # Extract text from document
        text = extract_text_from_file(file_path)
        
        if not text:
            raise ValueError(f"Could not extract text from {original_filename}")
        
        # Categorize the document based on content
        categories = categorize_document(text, original_filename)
        
        # Chunk the text with metadata
        chunks = chunk_text(text, doc_id, original_filename, categories)
        
        # Store chunks in vector database
        store_document_chunks(chunks)
        
        # Store document metadata
        metadata = {
            "id": doc_id,
            "filename": original_filename,
            "upload_date": datetime.now().isoformat(),
            "categories": categories,
            "file_path": file_path
        }
        
        add_document_metadata(doc_id, metadata)
        
        return {
            "success": True,
            "document_id": doc_id,
            "categories": categories,
            "chunk_count": len(chunks)
        }
        
    except Exception as e:
        # Clean up the file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise Exception(f"Error processing document: {str(e)}")