from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from .config import get_settings, MCPInspectorConfig
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

class MCPInspectorMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.settings = get_settings()
        self.inspector_config = MCPInspectorConfig(self.settings)
        self.connections: Dict[str, Dict[str, Any]] = {}

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self.inspector_config.enabled:
            return await call_next(request)

        # Generate unique request ID
        request_id = f"{time.time()}_{request.client.host}"

        # Capture request data
        request_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "client": {
                "host": request.client.host,
                "port": request.client.port
            }
        }

        # Try to capture request body
        try:
            body = await request.body()
            if body:
                request_data["body"] = json.loads(body)
        except:
            request_data["body"] = None

        # Store connection info
        self.connections[request_id] = {
            "request": request_data,
            "start_time": time.time()
        }

        # Send request data to MCP Inspector
        await self._send_to_inspector("request", request_id, request_data)

        # Process the request
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        # Capture response data
        response_data = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "process_time": process_time
        }

        # Try to capture response body
        try:
            body = response.body
            if body:
                response_data["body"] = json.loads(body)
        except:
            response_data["body"] = None

        # Update connection info
        self.connections[request_id]["response"] = response_data
        self.connections[request_id]["end_time"] = time.time()

        # Send response data to MCP Inspector
        await self._send_to_inspector("response", request_id, response_data)

        return response

    async def _send_to_inspector(self, event_type: str, request_id: str, data: dict):
        """Send data to MCP Inspector"""
        if not self.inspector_config.enabled:
            return

        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{self.inspector_config.url}/events",
                    json={
                        "event_type": event_type,
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "data": data
                    }
                )
        except Exception as e:
            logger.error(f"Failed to send data to MCP Inspector: {e}")

    def get_active_connections(self) -> Dict[str, Dict[str, Any]]:
        """Get all active connections"""
        return self.connections

    def get_connection(self, request_id: str) -> Dict[str, Any]:
        """Get specific connection details"""
        return self.connections.get(request_id)

    def cleanup_old_connections(self, max_age_seconds: int = 3600):
        """Clean up old connection records"""
        current_time = time.time()
        to_remove = []

        for request_id, conn_data in self.connections.items():
            if current_time - conn_data["start_time"] > max_age_seconds:
                to_remove.append(request_id)

        for request_id in to_remove:
            del self.connections[request_id]