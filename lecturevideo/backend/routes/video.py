from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
from pathlib import Path
from services.video_processor import VideoProcessor
from schemas.video import VideoUploadResponse, VideoTranscript

router = APIRouter()
video_processor = VideoProcessor()

@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file"""
    if not file.filename.endswith(('.mp4', '.MP4')):
        raise HTTPException(status_code=400, detail="Only MP4 files are allowed")
    
    try:
        # Generate unique video ID and save file
        video_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1]
        filename = f"{video_id}.{file_extension}"
        file_path = os.path.join(os.getenv("UPLOAD_DIR", "uploads"), filename)
        
        # Ensure upload directory exists
        os.makedirs(os.getenv("UPLOAD_DIR", "uploads"), exist_ok=True)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return VideoUploadResponse(
            filename=filename,
            file_path=file_path,
            message="Video uploaded successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/{video_id}", response_model=VideoTranscript)
async def process_video(video_id: str):
    """Process uploaded video: extract audio, transcribe, and create embeddings"""
    try:
        # Get video file path
        video_path = os.path.join(os.getenv("UPLOAD_DIR", "uploads"), f"{video_id}.mp4")
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Process video
        chunks = video_processor.process_video(video_path, video_id)
        
        return VideoTranscript(
            video_id=video_id,
            chunks=chunks,
            status="processed"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 