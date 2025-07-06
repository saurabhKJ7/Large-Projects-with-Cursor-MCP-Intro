from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartTicket"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartticket.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Vector Store
    VECTOR_STORE_PATH: str = os.getenv("VECTOR_STORE_PATH", "./data/vector_store")
    
    # OpenAI Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
    MAX_TOKENS: int = 500
    TEMPERATURE: float = 0.7
    
    # Model Settings
    EMBEDDING_MODEL: str = "sentence-transformers/all-mpnet-base-v2"
    CONFIDENCE_THRESHOLD: float = 0.7
    
    # RAG Settings
    MAX_RELEVANT_CHUNKS: int = 5
    CONTEXT_WINDOW: int = 2000
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None

    class Config:
        case_sensitive = True

settings = Settings() 