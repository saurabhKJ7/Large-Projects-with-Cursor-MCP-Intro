from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class TicketBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str]
    priority: Optional[str]
    status: Optional[str]
    tags: Optional[List[str]]
    assigned_to: Optional[int]

class TicketResponseBase(BaseModel):
    content: str
    is_automated: bool = False
    confidence_score: Optional[float]
    sources: Optional[List[Dict]]

class TicketResponseCreate(TicketResponseBase):
    ticket_id: int

class TicketResponseOut(TicketResponseBase):
    id: int
    ticket_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketList(BaseModel):
    id: int
    title: str
    category: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    confidence_score: float
    tags: List[str]
    user_id: int
    assigned_to: Optional[int]
    created_at: datetime
    updated_at: datetime
    responses: List[TicketResponseOut]
    
    class Config:
        from_attributes = True 