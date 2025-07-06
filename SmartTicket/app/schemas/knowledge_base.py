from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class KnowledgeBaseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    category: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)

class KnowledgeBaseCreate(KnowledgeBaseBase):
    pass

class KnowledgeBaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    content: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]]

class KnowledgeBaseResponse(KnowledgeBaseBase):
    id: int
    embedding_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 