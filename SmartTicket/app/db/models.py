from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    tickets = relationship("Ticket", back_populates="user")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(String, index=True)
    priority = Column(String, index=True)
    status = Column(String, index=True)
    confidence_score = Column(Float)
    tags = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="tickets", foreign_keys=[user_id])
    agent = relationship("User", foreign_keys=[assigned_to])
    responses = relationship("TicketResponse", back_populates="ticket")

class TicketResponse(Base):
    __tablename__ = "ticket_responses"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    content = Column(Text)
    is_automated = Column(Boolean, default=False)
    confidence_score = Column(Float)
    sources = Column(JSON)  # References to knowledge base entries used
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="responses")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    category = Column(String, index=True)
    tags = Column(JSON)
    embedding_id = Column(String, unique=True)  # Reference to vector store
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 