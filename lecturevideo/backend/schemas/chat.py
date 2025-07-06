from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    video_id: str
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

class Timestamp(BaseModel):
    time: float
    text: str

class ChatResponse(BaseModel):
    response: str
    timestamps: List[Timestamp]
    relevant_chunks: List[str] 