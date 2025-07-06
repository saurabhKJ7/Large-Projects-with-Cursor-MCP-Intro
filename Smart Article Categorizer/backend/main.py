from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import json

from app.models.classifier import ArticleClassifier
from app.embeddings.embedding_factory import EmbeddingFactory
from app.utils.visualization import create_visualization

app = FastAPI(title="Smart Article Categorizer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
classifier = ArticleClassifier()

class ArticleInput(BaseModel):
    text: str

class BatchArticleInput(BaseModel):
    articles: List[str]

@app.post("/api/classify")
async def classify_article(article: ArticleInput):
    try:
        results = classifier.classify(article.text)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def get_model_metrics():
    try:
        metrics = classifier.get_model_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch")
async def batch_classify(articles: BatchArticleInput):
    try:
        results = [classifier.classify(text) for text in articles.articles]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/visualize")
async def get_visualization():
    try:
        visualization_data = create_visualization(classifier)
        return visualization_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 