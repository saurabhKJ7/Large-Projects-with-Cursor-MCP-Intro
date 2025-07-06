# Smart Article Categorizer

A full-stack machine learning system that classifies news articles into 6 categories using multiple embedding approaches.

## Features

- Multi-model article classification using 4 different embedding approaches:
  1. Word2Vec/GloVe
  2. BERT [CLS] Embeddings
  3. Sentence-BERT
  4. OpenAI Embeddings
- Real-time classification with confidence scores
- Model performance comparison
- Interactive visualization of embeddings
- Modern React + FastAPI stack

## Categories

- Tech
- Finance
- Healthcare
- Sports
- Politics
- Entertainment

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the project root and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

5. Start the frontend development server:
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── embeddings/
│   │   ├── utils/
│   │   └── api/
│   ├── data/
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
├── requirements.txt
└── README.md
```

## API Endpoints

- `POST /api/classify`: Classify a single article
- `GET /api/models`: Get model performance metrics
- `POST /api/batch`: Batch classification
- `GET /api/visualize`: Get embedding visualization data

## Model Details

The system uses Logistic Regression classifiers trained on different embedding representations:

1. **Word2Vec/GloVe**: Average word embeddings
2. **BERT**: [CLS] token embeddings from bert-base-uncased
3. **Sentence-BERT**: all-MiniLM-L6-v2 embeddings
4. **OpenAI**: text-embedding-ada-002 embeddings

## License

MIT 