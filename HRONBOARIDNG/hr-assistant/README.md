# HR Onboarding Knowledge Assistant

An AI-powered HR assistant that replaces manual HR induction calls by allowing new employees to chat with an AI assistant about HR policies, benefits, leaves, and more.

## Features

- **HR Document Upload**: Support for PDF, DOCX, and TXT files
- **Text Extraction & Chunking**: Intelligent HR-specific chunking
- **Embeddings + Vector DB**: Uses FAISS/Chroma for storing text with metadata
- **RAG Pipeline**: Query understanding, retrieval, answer generation with policy citations
- **Categorization**: Identifies query category (e.g., benefits, leave)
- **Conversational UI**: A simple ChatGPT-like frontend
- **Admin Dashboard**: For uploading/viewing/deleting HR docs

## Tech Stack

### Frontend
- React + Tailwind CSS
- Vite for development
- React Router for navigation
- Axios for API requests

### Backend
- FastAPI (Python)
- Vector DB: FAISS or ChromaDB
- Embedding Model: text-embedding-3-small from OpenAI
- LLM: gpt-4o via OpenAI API
- PDF/DOCX Parsing: pdfplumber, python-docx
- Chunking: HR-specific rule-based splitter using langchain.text_splitter

## Project Structure

```
hr-assistant/
├── backend/
│   ├── main.py (FastAPI app)
│   ├── ingest.py (document processing)
│   ├── rag_pipeline.py (retrieval + answer)
│   ├── categorize.py (query classification)
│   ├── vector_store.py (embedding + FAISS/Chroma)
│   └── utils/
│       ├── parser.py (PDF/DOCX extractor)
│       └── chunker.py (custom chunking)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.jsx
│   │   │   └── UploadForm.jsx
│   │   ├── pages/
│   │   │   ├── Chat.jsx
│   │   │   └── Admin.jsx
│   │   └── App.jsx
├── docker-compose.yml
└── README.md
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Environment Setup

1. Clone the repository

2. Create a `.env` file in the project root with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
VECTOR_DB_TYPE=FAISS  # or CHROMA
```

### Running with Docker

1. Build and start the containers:

```bash
docker-compose up --build
```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Running Without Docker

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd hr-assistant/backend
```

2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
VECTOR_DB_TYPE=FAISS  # or CHROMA
```

5. Run the backend server:

```bash
uvicorn main:app --reload
```

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd hr-assistant/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Access the frontend at http://localhost:3000

## Usage

### Admin Dashboard

1. Navigate to the Admin page
2. Upload HR documents (PDF, DOCX, TXT)
3. View and manage uploaded documents

### Chat Interface

1. Navigate to the Chat page
2. Ask questions about HR policies, benefits, leaves, etc.
3. Receive answers with citations to the source documents

## API Endpoints

- `POST /upload` - Upload HR document
- `POST /ask` - Chat endpoint for user queries
- `GET /admin/docs` - List uploaded documents
- `DELETE /admin/docs/{id}` - Delete document

## License

MIT