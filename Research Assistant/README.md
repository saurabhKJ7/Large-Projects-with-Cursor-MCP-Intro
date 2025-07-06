# Research Assistant

An AI-powered research assistant that combines PDF document analysis with real-time web search to provide comprehensive, well-cited answers to your questions.

## Features

- 📚 PDF Document Upload & Analysis
- 🌐 Real-time Web Search Integration
- 🔍 Hybrid Retrieval System (Dense + Sparse)
- 🎯 Smart Result Re-ranking
- 📝 Source Citations & References
- 🧠 Intelligent Answer Synthesis
- ⚡ Fast Vector & Keyword Search

## Technical Architecture

- Backend: FastAPI
- Frontend: Streamlit
- Embedding Models: OpenAI text-embedding-3-small / sentence-transformers
- LLM: GPT-4/3.5-turbo
- Vector Search: FAISS
- Text Search: Whoosh
- Re-ranker: cross-encoder/ms-marco-MiniLM-L-6-v2

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_key_here
   SERPER_API_KEY=your_key_here  # or BING_API_KEY
   ```
5. Run the application:
   ```bash
   # Start the FastAPI backend
   uvicorn app.main:app --reload

   # In another terminal, start the Streamlit frontend
   streamlit run frontend/app.py
   ```

## Project Structure

```
research_assistant/
├── app/
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   ├── config.py        # Configuration settings
│   │   └── security.py      # API security
│   ├── models/
│   │   ├── document.py      # Document processing
│   │   └── search.py        # Search models
│   └── services/
│       ├── pdf.py           # PDF processing
│       ├── embedding.py     # Vector embeddings
│       ├── search.py        # Search service
│       └── synthesis.py     # Answer synthesis
├── frontend/
│   └── app.py              # Streamlit interface
└── tests/
    └── test_*.py           # Test files
```

## Usage

1. Upload PDF documents through the web interface
2. Ask questions in natural language
3. Get comprehensive answers with citations from both PDF and web sources
4. Toggle between PDF-only, web-only, or hybrid answers

## License

MIT License 