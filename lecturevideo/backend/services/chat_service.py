import os
import json
import faiss
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import SystemMessage, HumanMessage, AIMessage

class ChatService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.7)
        self.faiss_index_path = os.getenv("FAISS_INDEX_PATH", "faiss_index")

    def load_video_data(self, video_id: str) -> Tuple[faiss.Index, List[Dict]]:
        """Load FAISS index and chunks for a video"""
        index_path = Path(self.faiss_index_path) / f"{video_id}_index.faiss"
        chunks_path = Path(self.faiss_index_path) / f"{video_id}_chunks.json"
        
        index = faiss.read_index(str(index_path))
        with open(chunks_path, 'r') as f:
            chunks = json.load(f)
            
        return index, chunks

    def get_relevant_chunks(self, query: str, index: faiss.Index, chunks: List[Dict], k: int = 3) -> List[Dict]:
        """Retrieve relevant chunks using similarity search"""
        query_embedding = self.embeddings.embed_query(query)
        D, I = index.search(np.array([query_embedding]).astype('float32'), k)
        return [chunks[i] for i in I[0]]

    def format_conversation_history(self, history: List[Dict]) -> List:
        """Format conversation history for LangChain"""
        formatted_messages = []
        for msg in history:
            if msg["role"] == "user":
                formatted_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                formatted_messages.append(AIMessage(content=msg["content"]))
        return formatted_messages

    def generate_response(self, query: str, relevant_chunks: List[Dict], conversation_history: List[Dict] = None) -> Dict:
        """Generate response using LangChain and GPT-4"""
        # Format context from relevant chunks
        context = "\n\n".join([
            f"[{chunk['start_time']:.2f}-{chunk['end_time']:.2f}] {chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Create system message
        system_template = """You are an AI assistant helping students understand lecture content.
        Use the provided lecture transcript chunks to answer questions.
        Always reference specific timestamps when discussing content from the lecture.
        Format timestamps as [HH:MM:SS] in your responses.
        If you're not sure about something, say so rather than making things up."""

        # Create messages list
        messages = [SystemMessage(content=system_template)]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(self.format_conversation_history(conversation_history))
        
        # Add current query context and question
        context_template = """Here are the relevant parts of the lecture transcript:
        {context}
        
        Please answer the following question based on this context: {question}"""
        
        messages.append(HumanMessage(content=context_template.format(
            context=context,
            question=query
        )))
        
        # Generate response
        response = self.llm.invoke(messages)
        
        # Extract timestamps from relevant chunks
        timestamps = [
            {"time": chunk["start_time"], "text": chunk["text"][:100] + "..."}
            for chunk in relevant_chunks
        ]
        
        return {
            "response": response.content,
            "timestamps": timestamps,
            "relevant_chunks": [chunk["text"] for chunk in relevant_chunks]
        }

    def chat(self, video_id: str, message: str, conversation_history: List[Dict] = None) -> Dict:
        """Main chat function that coordinates the RAG pipeline"""
        # Load video data
        index, chunks = self.load_video_data(video_id)
        
        # Get relevant chunks
        relevant_chunks = self.get_relevant_chunks(message, index, chunks)
        
        # Generate response
        return self.generate_response(message, relevant_chunks, conversation_history) 