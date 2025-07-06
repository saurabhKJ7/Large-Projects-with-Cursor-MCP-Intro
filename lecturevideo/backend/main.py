from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Chat with your Lecture API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads directory for serving video files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Import and include routers
from routes import video, chat

app.include_router(video.router, prefix="/api/video", tags=["video"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 