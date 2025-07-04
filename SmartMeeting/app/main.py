from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
import logging
import asyncio
from datetime import datetime
from .auth import verify_api_key, get_current_user
from .models import DiscordMessage, ChannelInfo, MessageFilter
from .config import Settings

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Discord MCP Server",
    description="Model Context Protocol server for Discord integration",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Discord client
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

@app.on_event("startup")
async def startup_event():
    """Initialize Discord bot and connect to Discord on startup"""
    try:
        asyncio.create_task(bot.start(os.getenv('DISCORD_BOT_TOKEN')))
        logger.info("Discord bot started successfully")
    except Exception as e:
        logger.error(f"Failed to start Discord bot: {e}")
        raise

@app.post("/discord/send_message")
async def send_message(
    channel_id: int,
    content: str,
    current_user = Depends(get_current_user)
):
    """Send a message to a Discord channel"""
    try:
        channel = bot.get_channel(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        message = await channel.send(content)
        return {"message_id": message.id, "content": message.content}
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/discord/get_messages")
async def get_messages(
    channel_id: int,
    limit: int = 50,
    before: Optional[int] = None,
    current_user = Depends(get_current_user)
):
    """Retrieve message history from a Discord channel"""
    try:
        channel = bot.get_channel(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        messages = []
        async for message in channel.history(limit=limit, before=discord.Object(id=before) if before else None):
            messages.append({
                "id": message.id,
                "content": message.content,
                "author": str(message.author),
                "timestamp": message.created_at.isoformat()
            })
        return messages
    except Exception as e:
        logger.error(f"Error retrieving messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/discord/get_channel_info")
async def get_channel_info(
    channel_id: int,
    current_user = Depends(get_current_user)
):
    """Fetch channel metadata"""
    try:
        channel = bot.get_channel(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        return {
            "id": channel.id,
            "name": channel.name,
            "type": str(channel.type),
            "position": channel.position,
            "category": channel.category.name if channel.category else None
        }
    except Exception as e:
        logger.error(f"Error retrieving channel info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/discord/search_messages")
async def search_messages(
    channel_id: int,
    query: str,
    limit: int = 100,
    current_user = Depends(get_current_user)
):
    """Search messages with filters"""
    try:
        channel = bot.get_channel(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        messages = []
        async for message in channel.history(limit=limit):
            if query.lower() in message.content.lower():
                messages.append({
                    "id": message.id,
                    "content": message.content,
                    "author": str(message.author),
                    "timestamp": message.created_at.isoformat()
                })
        return messages
    except Exception as e:
        logger.error(f"Error searching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/discord/moderate_content")
async def moderate_content(
    message_id: int,
    channel_id: int,
    action: str,  # 'delete' or 'warn'
    reason: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Moderate content (delete messages, manage users)"""
    try:
        channel = bot.get_channel(channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        message = await channel.fetch_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if action == "delete":
            await message.delete()
            return {"status": "success", "action": "delete", "message_id": message_id}
        elif action == "warn":
            await message.add_reaction('⚠️')
            if reason:
                await channel.send(f"Warning: {reason}")
            return {"status": "success", "action": "warn", "message_id": message_id}
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
    except Exception as e:
        logger.error(f"Error moderating content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@bot.event
async def on_ready():
    """Event handler for when the bot is ready"""
    logger.info(f'Logged in as {bot.user.name} ({bot.user.id})')

@bot.event
async def on_message(message):
    """Event handler for new messages"""
    if message.author == bot.user:
        return
    
    # Process commands if any
    await bot.process_commands(message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)