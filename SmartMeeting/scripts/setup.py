import os
import sys
import secrets
from pathlib import Path

def create_directory_structure():
    """Create the necessary directory structure for the project"""
    directories = [
        'app',
        'tests',
        'alembic',
        'alembic/versions',
        'scripts',
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        Path(directory).joinpath('__init__.py').touch()

def generate_secret_key():
    """Generate a secure secret key"""
    return secrets.token_urlsafe(32)

def create_env_file():
    """Create .env file if it doesn't exist"""
    if not os.path.exists('.env'):
        secret_key = generate_secret_key()
        env_content = f"""# Discord Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_discord

# Security
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_MINUTES=1

# MCP Inspector
MCP_INSPECTOR_ENABLED=true
MCP_INSPECTOR_HOST=localhost
MCP_INSPECTOR_PORT=8000
"""
        with open('.env', 'w') as f:
            f.write(env_content)

def setup_discord_bot():
    """Instructions for setting up the Discord bot"""
    print("\nDiscord Bot Setup Instructions:")
    print("1. Go to https://discord.com/developers/applications")
    print("2. Click 'New Application' and give it a name")
    print("3. Go to the 'Bot' section and click 'Add Bot'")
    print("4. Copy the bot token and update DISCORD_BOT_TOKEN in .env")
    print("5. Go to OAuth2 section and copy:")
    print("   - Client ID -> update DISCORD_CLIENT_ID in .env")
    print("   - Client Secret -> update DISCORD_CLIENT_SECRET in .env")
    print("6. In OAuth2 -> URL Generator:")
    print("   - Select 'bot' scope")
    print("   - Select required permissions")
    print("   - Copy the generated URL and use it to invite the bot to your server")

def setup_database():
    """Instructions for setting up the database"""
    print("\nDatabase Setup Instructions:")
    print("1. Create a PostgreSQL database:")
    print("   createdb mcp_discord")
    print("2. Update DATABASE_URL in .env with your database credentials")
    print("3. Run migrations:")
    print("   alembic upgrade head")

def main():
    print("Setting up Discord MCP Server...")
    
    # Create directory structure
    create_directory_structure()
    print("✓ Created directory structure")
    
    # Create .env file
    create_env_file()
    print("✓ Created .env file")
    
    # Setup instructions
    setup_discord_bot()
    setup_database()
    
    print("\nSetup complete! Next steps:")
    print("1. Follow the Discord Bot Setup Instructions above")
    print("2. Follow the Database Setup Instructions above")
    print("3. Install dependencies: pip install -r requirements.txt")
    print("4. Start the server: uvicorn app.main:app --reload")

if __name__ == '__main__':
    main()