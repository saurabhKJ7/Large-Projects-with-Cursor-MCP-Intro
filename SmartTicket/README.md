# SmartTicket - Intelligent Customer Support System

SmartTicket is an advanced customer support ticketing system that leverages RAG (Retrieval Augmented Generation) architecture to automatically categorize tickets and generate smart responses based on historical data and company knowledge base.

## Features

- 🎫 Automated ticket categorization and tagging
- 🤖 Smart response generation using RAG
- 📚 Integration with company knowledge base
- 🔍 Semantic search for similar past tickets
- 📊 Confidence scoring and escalation logic
- 👤 Customer history integration
- 📈 Learning from successful resolutions

## Technical Architecture

- FastAPI backend for REST API endpoints
- ChromaDB for vector storage
- LangChain for RAG pipeline
- Sentence Transformers for text embeddings
- PostgreSQL for relational data storage

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/SmartTicket.git
cd SmartTicket
```

2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the application
```bash
uvicorn app.main:app --reload
```

## Project Structure

```
SmartTicket/
├── app/
│   ├── api/            # API endpoints
│   ├── core/           # Core business logic
│   ├── db/             # Database models and migrations
│   ├── rag/            # RAG pipeline implementation
│   ├── schemas/        # Pydantic models
│   └── utils/          # Utility functions
├── tests/              # Test cases
├── data/               # Sample data and knowledge base
└── docs/               # Documentation
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 