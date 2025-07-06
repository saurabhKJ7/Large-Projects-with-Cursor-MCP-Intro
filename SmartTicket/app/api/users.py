from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from app.core.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash
)
from app.core.config import settings
from app.db.database import get_db
from app.schemas.user import UserCreate, User, Token, UserUpdate
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=User)
async def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: UserModel = Depends(get_current_active_user)
):
    return current_user

@router.put("/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        if field == "password":
            value = get_password_hash(value)
            field = "hashed_password"
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only admin can list all users
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users 