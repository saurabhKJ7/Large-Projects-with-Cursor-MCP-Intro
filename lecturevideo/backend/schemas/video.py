from pydantic import BaseModel
from typing import Optional, List

class VideoUploadResponse(BaseModel):
    filename: str
    file_path: str
    message: str

class TranscriptChunk(BaseModel):
    text: str
    start_time: float
    end_time: float

class VideoTranscript(BaseModel):
    video_id: str
    chunks: List[TranscriptChunk]
    status: str 