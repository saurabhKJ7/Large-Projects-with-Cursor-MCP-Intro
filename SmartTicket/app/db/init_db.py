from sqlalchemy.orm import Session
from app.core.auth import get_password_hash
from app.db.database import Base, engine
from app.models.user import User
from app.models.ticket import Ticket
from app.models.knowledge_base import KnowledgeBase

def init_db(db: Session) -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Check if admin user exists
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        # Create admin user
        admin_password = "admin123"  # Change this in production
        db_admin = User(
            email="admin@example.com",
            hashed_password=get_password_hash(admin_password),
            full_name="Admin User",
            is_active=True,
            is_admin=True
        )
        db.add(db_admin)
        db.commit()
        print("Created admin user: admin@example.com")
    
    print("Database initialized successfully") 