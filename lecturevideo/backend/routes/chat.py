from fastapi import APIRouter, HTTPException
from schemas.chat import ChatRequest, ChatResponse
from services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

@router.post("/message", response_model=ChatResponse)
async def chat_with_video(request: ChatRequest):
    """Send a message and get a response based on video content"""
    try:
        response = chat_service.chat(
            video_id=request.video_id,
            message=request.message,
            conversation_history=request.conversation_history
        )
        return response
    
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Video data not found. Make sure the video has been processed."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 