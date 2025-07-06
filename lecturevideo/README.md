# Chat with your Lecture

An AI-powered application that allows students to upload lecture videos and interact with the content through a chat interface. The application uses OpenAI's Whisper for transcription and GPT-4 for answering questions about the lecture content.

## Features

- Upload and process lecture videos (MP4 format)
- Extract audio and generate transcripts with timestamps
- Chat interface for asking questions about the lecture
- Video player with timestamp navigation
- RAG (Retrieval-Augmented Generation) system for accurate responses
- Modern, responsive UI with Tailwind CSS

## Prerequisites

- Python 3.8+
- Node.js 14+
- OpenAI API key
- FFmpeg (for audio extraction)

## Setup

1. Clone the repository and set up the environment:

```bash
# Create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
```

2. Create a `.env` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
UPLOAD_DIR=uploads
FAISS_INDEX_PATH=faiss_index
```

3. Create necessary directories:

```bash
mkdir uploads faiss_index
```

## Running the Application

1. Start the backend server:

```bash
# From the root directory
uvicorn backend.main:app --reload
```

2. Start the frontend development server:

```bash
# From the frontend directory
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Upload a lecture video (MP4 format) using the upload interface
2. Wait for the video to be processed (audio extraction, transcription, and embedding creation)
3. Once processed, you can:
   - Watch the video
   - Ask questions about the lecture content
   - Click on timestamps in the AI's responses to jump to specific parts of the video

## Technical Details

- Backend: FastAPI, LangChain, OpenAI API, FAISS
- Frontend: React, TypeScript, Tailwind CSS
- Video Processing: FFmpeg, OpenAI Whisper
- Vector Database: FAISS (Facebook AI Similarity Search)
- Language Models: GPT-4 (primary) or GPT-3.5-turbo (fallback)

## Notes

- The application is designed for educational purposes
- Video processing time depends on the length of the video and your internet connection
- Make sure you have sufficient OpenAI API credits for transcription and chat functionality 