import os
from moviepy.editor import VideoFileClip
from openai import OpenAI
import json
from typing import List, Dict
import numpy as np
from langchain_openai import OpenAIEmbeddings
import faiss
from pathlib import Path

class VideoProcessor:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.faiss_index_path = os.getenv("FAISS_INDEX_PATH", "faiss_index")
        os.makedirs(self.faiss_index_path, exist_ok=True)

    def extract_audio(self, video_path: str) -> str:
        """Extract audio from video file"""
        audio_path = video_path.rsplit(".", 1)[0] + ".mp3"
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path)
        video.close()
        return audio_path

    def transcribe_audio(self, audio_path: str) -> Dict:
        """Transcribe audio using OpenAI Whisper API"""
        with open(audio_path, "rb") as audio_file:
            transcript = self.client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-1",
                response_format="verbose_json",
                timestamp_granularities=["segment"]
            )
        return transcript

    def chunk_transcript(self, transcript: Dict, chunk_size: int = 1000) -> List[Dict]:
        """Chunk transcript while preserving timestamps"""
        segments = transcript.segments
        chunks = []
        current_chunk = {
            "text": "",
            "start_time": segments[0].start,
            "end_time": segments[0].end
        }
        
        for segment in segments:
            if len(current_chunk["text"]) + len(segment.text) > chunk_size:
                chunks.append(current_chunk)
                current_chunk = {
                    "text": segment.text,
                    "start_time": segment.start,
                    "end_time": segment.end
                }
            else:
                current_chunk["text"] += " " + segment.text
                current_chunk["end_time"] = segment.end
        
        if current_chunk["text"]:
            chunks.append(current_chunk)
        
        return chunks

    def create_embeddings(self, chunks: List[Dict], video_id: str):
        """Create and store embeddings in FAISS"""
        texts = [chunk["text"] for chunk in chunks]
        embeddings = self.embeddings.embed_documents(texts)
        
        # Convert embeddings to numpy array
        embeddings_array = np.array(embeddings).astype('float32')
        
        # Create FAISS index
        dimension = len(embeddings[0])
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings_array)
        
        # Save index and chunks
        index_path = Path(self.faiss_index_path) / f"{video_id}_index.faiss"
        chunks_path = Path(self.faiss_index_path) / f"{video_id}_chunks.json"
        
        faiss.write_index(index, str(index_path))
        with open(chunks_path, 'w') as f:
            json.dump(chunks, f)

    def process_video(self, video_path: str, video_id: str) -> List[Dict]:
        """Process video end-to-end: extract audio, transcribe, chunk, and create embeddings"""
        audio_path = self.extract_audio(video_path)
        transcript = self.transcribe_audio(audio_path)
        chunks = self.chunk_transcript(transcript)
        self.create_embeddings(chunks, video_id)
        
        # Clean up audio file
        os.remove(audio_path)
        
        return chunks 