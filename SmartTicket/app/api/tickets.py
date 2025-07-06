from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketUpdate,
    TicketList
)
from app.core.auth import get_current_user
from app.rag.pipeline import RAGPipeline
from app.models.user import User
from app.models.ticket import Ticket

router = APIRouter()
rag_pipeline = RAGPipeline()

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new support ticket with automatic categorization
    """
    # Process ticket with RAG pipeline
    category, tags, confidence_score = rag_pipeline.process_ticket(ticket.description)
    
    # Generate automated response if confidence is high enough
    response_text, sources, response_confidence = rag_pipeline.generate_response(ticket.description)
    
    # Create ticket in database
    db_ticket = Ticket(
        title=ticket.title,
        description=ticket.description,
        category=category,
        tags=tags,
        user_id=current_user.id,
        confidence_score=confidence_score,
        status="new" if confidence_score < 0.7 else "auto-response"
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    # If confidence is high enough, create automated response
    if response_confidence >= 0.7:
        ticket_response = TicketResponse(
            ticket_id=db_ticket.id,
            content=response_text,
            is_automated=True,
            confidence_score=response_confidence,
            sources=sources
        )
        db.add(ticket_response)
        db.commit()
    
    return db_ticket

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific ticket by ID
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check if user has access to ticket
    if ticket.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return ticket

@router.get("/", response_model=List[TicketList])
async def list_tickets(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all tickets with optional filtering
    """
    query = db.query(Ticket)
    
    # Apply filters
    if status:
        query = query.filter(Ticket.status == status)
    if category:
        query = query.filter(Ticket.category == category)
    
    # Filter by user unless admin
    if not current_user.is_admin:
        query = query.filter(Ticket.user_id == current_user.id)
    
    tickets = query.offset(skip).limit(limit).all()
    return tickets

@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a ticket
    """
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    if not current_user.is_admin and db_ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update ticket fields
    for field, value in ticket_update.dict(exclude_unset=True).items():
        setattr(db_ticket, field, value)
    
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.post("/{ticket_id}/response", response_model=TicketResponse)
async def add_response(
    ticket_id: int,
    response: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a response to a ticket
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Create response
    ticket_response = TicketResponse(
        ticket_id=ticket_id,
        content=response,
        is_automated=False,
        user_id=current_user.id
    )
    db.add(ticket_response)
    
    # Update ticket status
    ticket.status = "responded"
    
    db.commit()
    return ticket 