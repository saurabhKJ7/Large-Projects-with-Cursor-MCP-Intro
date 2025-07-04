# Discord MCP Server

A Model Context Protocol (MCP) server that enables AI models to interact with Discord through a secure and monitored API interface. This implementation includes Discord bot integration, authentication layer, and MCP Inspector for debugging.

## Features

### Discord Integration
- Send messages to channels
- Retrieve message history
- Fetch channel metadata
- Search messages with filters
- Content moderation capabilities

### Security
- API Key Authentication
- Granular permission system
- Multi-tenancy support
- Comprehensive audit logging

### MCP Inspector Integration
- Real-time request/response monitoring
- Connection tracking
- Debug interface

## Prerequisites

- Python 3.8+
- PostgreSQL database
- Discord Bot Token and Application credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SmartMeeting
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration values.

5. Initialize the database:
```bash
alembic upgrade head
```

## Configuration

Update the following variables in your `.env` file:

```env
# Discord Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_discord

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_MINUTES=1

# MCP Inspector
MCP_INSPECTOR_ENABLED=true
MCP_INSPECTOR_HOST=localhost
MCP_INSPECTOR_PORT=8000
```

## Usage

1. Start the server:
```bash
uvicorn app.main:app --reload
```

2. Create an API key:
```bash
curl -X POST http://localhost:8000/api/keys \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["read", "write"]}'
```

3. Use the API:
```bash
# Send a message
curl -X POST http://localhost:8000/discord/send_message \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"channel_id": 123456789, "content": "Hello from MCP!"}'
```

## API Endpoints

### Discord Operations
- `POST /discord/send_message` - Send a message to a channel
- `GET /discord/get_messages` - Retrieve message history
- `GET /discord/get_channel_info` - Get channel metadata
- `POST /discord/search_messages` - Search messages with filters
- `DELETE /discord/moderate_content` - Moderate content

### Authentication
- `POST /api/keys` - Create new API key
- `GET /api/keys` - List API keys
- `DELETE /api/keys/{key_id}` - Revoke API key

## Testing

Run the test suite:
```bash
pytest tests/
```

For coverage report:
```bash
pytest --cov=app tests/
```

## MCP Inspector

Access the MCP Inspector interface at:
```
http://localhost:8000/inspector
```

## Security Considerations

1. API Keys
   - Store securely and never expose in client-side code
   - Rotate regularly
   - Use appropriate permission scopes

2. Rate Limiting
   - Configure based on your usage patterns
   - Monitor for abuse

3. Audit Logging
   - Regular review of access logs
   - Set up alerts for suspicious activity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details