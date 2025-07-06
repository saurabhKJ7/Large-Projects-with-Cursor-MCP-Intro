import PyPDF2
from typing import List, Dict
import uuid
import os
from ..core.config import settings
from ..models.document import Document, DocumentChunk

class PDFProcessor:
    def __init__(self):
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP

    def extract_text_from_pdf(self, file_path: str) -> tuple[str, int]:
        """Extract text and metadata from PDF file"""
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            total_pages = len(reader.pages)
            text = ""
            
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            return text, total_pages

    def create_chunks(self, text: str, total_pages: int, document_id: str) -> List[DocumentChunk]:
        """Split text into overlapping chunks"""
        chunks = []
        words = text.split()
        
        current_chunk = []
        current_size = 0
        current_page = 1
        words_per_page = len(words) // total_pages
        
        for i, word in enumerate(words):
            current_chunk.append(word)
            current_size += 1
            
            # Estimate current page based on word position
            current_page = (i // words_per_page) + 1
            if current_page > total_pages:
                current_page = total_pages
            
            if current_size >= self.chunk_size:
                chunk_text = ' '.join(current_chunk)
                chunk_id = str(uuid.uuid4())
                
                chunks.append(DocumentChunk(
                    text=chunk_text,
                    page_number=current_page,
                    chunk_id=chunk_id,
                    document_id=document_id,
                    metadata={
                        "word_count": len(current_chunk),
                        "char_count": len(chunk_text)
                    }
                ))
                
                # Keep overlap words for next chunk
                current_chunk = current_chunk[-self.chunk_overlap:]
                current_size = len(current_chunk)
        
        # Add remaining words as last chunk if any
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunk_id = str(uuid.uuid4())
            chunks.append(DocumentChunk(
                text=chunk_text,
                page_number=current_page,
                chunk_id=chunk_id,
                document_id=document_id,
                metadata={
                    "word_count": len(current_chunk),
                    "char_count": len(chunk_text)
                }
            ))
        
        return chunks

    def process_pdf(self, file_path: str) -> Document:
        """Process PDF file and return Document object with chunks"""
        document_id = str(uuid.uuid4())
        text, total_pages = self.extract_text_from_pdf(file_path)
        
        chunks = self.create_chunks(text, total_pages, document_id)
        
        return Document(
            document_id=document_id,
            title=os.path.basename(file_path),
            content=text,
            chunks=chunks,
            total_pages=total_pages,
            file_path=file_path,
            file_type="pdf",
            metadata={
                "total_chunks": len(chunks),
                "total_words": len(text.split()),
                "total_chars": len(text)
            }
        ) 