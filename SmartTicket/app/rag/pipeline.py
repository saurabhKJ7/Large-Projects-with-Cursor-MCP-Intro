from typing import List, Dict, Tuple
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from app.core.config import settings
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class RAGPipeline:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL
        )
        self.vector_store = Chroma(
            persist_directory=settings.VECTOR_STORE_PATH,
            embedding_function=self.embeddings
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def process_ticket(self, ticket_text: str) -> Tuple[str, List[str], float]:
        """
        Process a new ticket and suggest category and tags
        """
        # Get embeddings for the ticket
        ticket_embedding = self.embeddings.embed_query(ticket_text)
        
        # Find similar tickets and knowledge base entries
        similar_docs = self.vector_store.similarity_search_with_score(
            ticket_text,
            k=5
        )
        
        # Extract categories and tags from similar documents
        categories = []
        tags = []
        for doc, score in similar_docs:
            if hasattr(doc.metadata, 'category'):
                categories.append(doc.metadata['category'])
            if hasattr(doc.metadata, 'tags'):
                tags.extend(doc.metadata['tags'])
        
        # Get the most common category
        if categories:
            suggested_category = max(set(categories), key=categories.count)
        else:
            suggested_category = "General"
        
        # Get unique tags with frequency > 1
        tag_counts = {}
        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        suggested_tags = [tag for tag, count in tag_counts.items() if count > 1]
        
        # Calculate confidence score based on similarity scores
        confidence_score = np.mean([score for _, score in similar_docs]) if similar_docs else 0.0
        
        return suggested_category, suggested_tags, confidence_score

    def generate_response(self, ticket_text: str) -> Tuple[str, List[Dict], float]:
        """
        Generate a response based on similar tickets and knowledge base
        """
        # Search for relevant documents
        similar_docs = self.vector_store.similarity_search_with_score(
            ticket_text,
            k=3
        )
        
        # Extract relevant information from similar documents
        response_components = []
        sources = []
        
        for doc, score in similar_docs:
            if score > settings.CONFIDENCE_THRESHOLD:
                response_components.append(doc.page_content)
                sources.append({
                    'id': doc.metadata.get('id'),
                    'title': doc.metadata.get('title'),
                    'relevance_score': score
                })
        
        # Combine response components into a coherent response
        if response_components:
            response = self._combine_responses(response_components)
            confidence_score = np.mean([s['relevance_score'] for s in sources])
        else:
            response = "I apologize, but I don't have enough confidence to provide an automated response. This ticket will be escalated to a human agent."
            confidence_score = 0.0
        
        return response, sources, confidence_score

    def _combine_responses(self, components: List[str]) -> str:
        """
        Combine multiple response components into a coherent response
        """
        # Simple combination for now - can be enhanced with more sophisticated methods
        combined = " ".join(components)
        # Clean up and format the response
        combined = combined.replace("\n", " ").replace("  ", " ").strip()
        return combined

    def add_to_knowledge_base(self, documents: List[Document]):
        """
        Add new documents to the vector store
        """
        # Split documents into chunks
        chunks = []
        for doc in documents:
            doc_chunks = self.text_splitter.split_documents([doc])
            chunks.extend(doc_chunks)
        
        # Add to vector store
        self.vector_store.add_documents(chunks)
        self.vector_store.persist()

    def update_knowledge_base(self, doc_id: str, new_content: str):
        """
        Update existing document in the knowledge base
        """
        # Delete old document
        self.vector_store.delete([doc_id])
        
        # Add new document
        new_doc = Document(
            page_content=new_content,
            metadata={'id': doc_id}
        )
        self.add_to_knowledge_base([new_doc]) 