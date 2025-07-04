from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    api_keys = relationship("APIKey", back_populates="user")
    access_logs = relationship("APIAccessLog", back_populates="user")

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    key_hash = Column(String)
    permissions = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="api_keys")
    access_logs = relationship("APIAccessLog", back_populates="api_key")

class APIAccessLog(Base):
    __tablename__ = "api_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    api_key_id = Column(Integer, ForeignKey("api_keys.id"))
    endpoint = Column(String)
    method = Column(String)
    status_code = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    request_data = Column(JSON, nullable=True)
    response_data = Column(JSON, nullable=True)
    
    user = relationship("User", back_populates="access_logs")
    api_key = relationship("APIKey", back_populates="access_logs")

# Pydantic models for request/response validation
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class APIKeyCreate(BaseModel):
    permissions: List[str]
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    key: str
    permissions: List[str]
    expires_at: Optional[datetime]

class DiscordMessage(BaseModel):
    content: str
    channel_id: int

class ChannelInfo(BaseModel):
    id: int
    name: str
    type: str
    position: int
    category: Optional[str]

class MessageFilter(BaseModel):
    channel_id: int
    query: str
    limit: Optional[int] = 100