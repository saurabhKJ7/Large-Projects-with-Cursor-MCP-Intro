from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import tickets, users, knowledge_base

app = FastAPI(
    title="SmartTicket API",
    description="Intelligent Customer Support Ticketing System with RAG Architecture",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(knowledge_base.router, prefix="/api/knowledge", tags=["knowledge"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to SmartTicket API",
        "docs": "/docs",
        "redoc": "/redoc"
    } 