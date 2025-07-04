from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, APIKey
import os
import secrets
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# API Key header
api_key_header = APIKeyHeader(name="X-API-Key")

def create_api_key(db: Session, user_id: int, permissions: list) -> str:
    """Create a new API key for a user"""
    api_key = secrets.token_urlsafe(32)
    hashed_key = pwd_context.hash(api_key)
    
    db_api_key = APIKey(
        user_id=user_id,
        key_hash=hashed_key,
        permissions=permissions,
        created_at=datetime.utcnow()
    )
    
    try:
        db.add(db_api_key)
        db.commit()
        db.refresh(db_api_key)
        return api_key
    except Exception as e:
        logger.error(f"Error creating API key: {e}")
        db.rollback()
        raise

def verify_api_key(api_key: str = Depends(api_key_header), db: Session = Depends(get_db)) -> APIKey:
    """Verify the API key and return the associated API key record"""
    try:
        # Find API key in database
        db_keys = db.query(APIKey).all()
        valid_key = None
        
        for db_key in db_keys:
            if pwd_context.verify(api_key, db_key.key_hash):
                valid_key = db_key
                break
        
        if not valid_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
            
        # Check if key is expired
        if valid_key.expires_at and valid_key.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired"
            )
            
        return valid_key
    except Exception as e:
        logger.error(f"Error verifying API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate API key"
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(api_key: APIKey = Depends(verify_api_key), db: Session = Depends(get_db)):
    """Get the current user based on the API key"""
    try:
        user = db.query(User).filter(User.id == api_key.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def check_permission(required_permission: str, api_key: APIKey = Depends(verify_api_key)):
    """Check if the API key has the required permission"""
    if required_permission not in api_key.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {required_permission} required"
        )
    return True

def log_api_access(db: Session, api_key: APIKey, endpoint: str, method: str, status_code: int):
    """Log API access for audit purposes"""
    try:
        from .models import APIAccessLog
        
        log_entry = APIAccessLog(
            api_key_id=api_key.id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            timestamp=datetime.utcnow()
        )
        
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Error logging API access: {e}")
        db.rollback()