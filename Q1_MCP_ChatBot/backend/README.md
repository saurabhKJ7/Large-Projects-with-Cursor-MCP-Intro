# MCP Q&A Chatbot Backend

This is the backend for the Model Context Protocol (MCP) Q&A chatbot. It uses FastAPI, LangChain, OpenAI GPT-4o-mini, and a vector database (FAISS/Chroma) to provide source-cited answers to technical questions about MCP servers.

## Features
- Data ingestion from documentation and GitHub repos (see `Q1_MCP_ChatBot/url.text`)
- Retrieval-Augmented Generation (RAG) pipeline
- FastAPI endpoints for chat and ingestion

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   - Create a `.env` file in `backend/app/` with your OpenAI API key:
     ```env
     OPENAI_API_KEY=sk-...
     MODEL_NAME=gpt-4o
     VECTOR_DB_TYPE=faiss  # or chroma
     ```

3. **Ingest data:**
   ```bash
   python app/ingest.py
   ```

4. **Run the API server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Endpoints
- `POST /chat` — Ask a question, get an answer with sources
- `POST /ingest` — Trigger data ingestion (admin only)

---

See the PRD for full requirements and features.
