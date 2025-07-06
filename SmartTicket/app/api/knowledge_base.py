from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.knowledge_base import KnowledgeBase as KBModel
from app.rag.pipeline import RAGPipeline
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    KnowledgeBaseResponse
)
from langchain.schema import Document
import json

router = APIRouter()
rag_pipeline = RAGPipeline()

@router.post("/", response_model=KnowledgeBaseResponse)
async def create_kb_entry(
    entry: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new knowledge base entry
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Create document for vector store
    doc = Document(
        page_content=entry.content,
        metadata={
            'title': entry.title,
            'category': entry.category,
            'tags': entry.tags
        }
    )
    
    # Add to vector store
    rag_pipeline.add_to_knowledge_base([doc])
    
    # Create database entry
    db_entry = KBModel(
        title=entry.title,
        content=entry.content,
        category=entry.category,
        tags=entry.tags,
        embedding_id=doc.metadata.get('id')  # Vector store reference
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

@router.get("/{entry_id}", response_model=KnowledgeBaseResponse)
async def get_kb_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific knowledge base entry
    """
    entry = db.query(KBModel).filter(KBModel.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )
    return entry

@router.get("/", response_model=List[KnowledgeBaseResponse])
async def list_kb_entries(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List knowledge base entries with optional filtering
    """
    query = db.query(KBModel)
    if category:
        query = query.filter(KBModel.category == category)
    entries = query.offset(skip).limit(limit).all()
    return entries

@router.put("/{entry_id}", response_model=KnowledgeBaseResponse)
async def update_kb_entry(
    entry_id: int,
    entry_update: KnowledgeBaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a knowledge base entry
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_entry = db.query(KBModel).filter(KBModel.id == entry_id).first()
    if not db_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found"
        )
    
    # Update vector store if content changed
    if entry_update.content:
        rag_pipeline.update_knowledge_base(
            db_entry.embedding_id,
            entry_update.content
        )
    
    # Update database entry
    for field, value in entry_update.dict(exclude_unset=True).items():
        setattr(db_entry, field, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.post("/bulk-upload")
async def bulk_upload_kb(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Bulk upload knowledge base entries from a file
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Process file content (assuming JSON format)
    content = await file.read()
    entries = json.loads(content)
    
    # Create entries
    created_entries = []
    for entry_data in entries:
        doc = Document(
            page_content=entry_data['content'],
            metadata={
                'title': entry_data['title'],
                'category': entry_data.get('category', 'General'),
                'tags': entry_data.get('tags', [])
            }
        )
        
        # Add to vector store
        rag_pipeline.add_to_knowledge_base([doc])
        
        # Create database entry
        db_entry = KBModel(
            title=entry_data['title'],
            content=entry_data['content'],
            category=entry_data.get('category', 'General'),
            tags=entry_data.get('tags', []),
            embedding_id=doc.metadata.get('id')
        )
        db.add(db_entry)
        created_entries.append(db_entry)
    
    db.commit()
    return {"message": f"Successfully created {len(created_entries)} entries"} 