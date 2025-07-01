import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4")
VECTOR_DB_TYPE = os.getenv("VECTOR_DB_TYPE", "faiss")

# Path to the url.txt file (relative to project root)
URLS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "Q1_MCP_ChatBot", "url.text")

# Directory to store vector DB and ingested data
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
