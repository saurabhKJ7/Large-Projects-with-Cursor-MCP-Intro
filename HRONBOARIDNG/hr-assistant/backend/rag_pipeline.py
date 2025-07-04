import os
import json
from typing import List, Dict, Any, Optional
import openai
from dotenv import load_dotenv

# Import local modules
from vector_store import query_vector_store
from categorize import categorize_query

# Load environment variables
load_dotenv()

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_response(query: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Generate a response to a user query using RAG (Retrieval Augmented Generation)
    
    Args:
        query: User's question
        chat_history: Optional chat history for context
        
    Returns:
        Dict containing the answer and source references
    """
    if chat_history is None:
        chat_history = []
    
    # Step 1: Categorize the query to understand what HR policy it relates to
    category = categorize_query(query)
    
    # Step 2: Retrieve relevant chunks from vector store based on query and category
    retrieved_chunks = query_vector_store(query, category, top_k=5)
    
    if not retrieved_chunks:
        return {
            "answer": "I'm sorry, I couldn't find any relevant information to answer your question. Please try rephrasing or ask about a different HR policy.",
            "sources": []
        }
    
    # Step 3: Prepare context from retrieved chunks
    context = ""
    sources = []
    
    for i, chunk in enumerate(retrieved_chunks):
        # Add chunk text to context
        context += f"\n\nChunk {i+1}:\n{chunk['text']}\n"
        
        # Add source information if not already in sources
        source_info = {
            "document": chunk["metadata"]["source"],
            "category": chunk["metadata"].get("category", "Uncategorized")
        }
        
        if source_info not in sources:
            sources.append(source_info)
    
    # Step 4: Prepare chat history context
    chat_context = ""
    if chat_history and len(chat_history) > 0:
        for message in chat_history[-3:]:  # Include last 3 messages for context
            role = message.get("role", "")
            content = message.get("content", "")
            chat_context += f"{role}: {content}\n"
    
    # Step 5: Generate response using OpenAI GPT-4o
    system_prompt = """
    You are an HR Onboarding Knowledge Assistant. Your role is to help new employees understand company HR policies, benefits, and procedures.
    
    When answering questions:
    1. Be professional, clear, and concise
    2. Only provide information that is supported by the provided HR documents
    3. Include specific policy references and citations when possible
    4. If you're unsure or the information isn't in the provided documents, acknowledge this clearly
    5. Do not make up information or policies
    6. Format your response in a readable way with appropriate paragraphs and bullet points when needed
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
    ]
    
    # Add chat history context if available
    if chat_context:
        messages.append({"role": "user", "content": f"Previous conversation:\n{chat_context}"})
        messages.append({"role": "assistant", "content": "I'll keep this conversation in mind when answering the next question."})
    
    # Add current query with context
    query_with_context = f"""
    Question: {query}
    
    Please answer the question based on the following information from HR documents:
    {context}
    
    In your answer, cite the specific documents and policies you're referencing. Format your answer in a clear, professional way.
    """
    
    messages.append({"role": "user", "content": query_with_context})
    
    # Call OpenAI API
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.3,  # Lower temperature for more factual responses
        max_tokens=1000
    )
    
    answer = response.choices[0].message.content
    
    return {
        "answer": answer,
        "sources": sources
    }