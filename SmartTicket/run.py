import uvicorn
from app.main import app
from app.db.database import SessionLocal
from app.db.init_db import init_db

if __name__ == "__main__":
    # Initialize database
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    
    # Run application
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 