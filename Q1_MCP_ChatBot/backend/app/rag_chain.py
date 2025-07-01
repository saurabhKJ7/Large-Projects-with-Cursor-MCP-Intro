from .vector_store import get_vector_store, get_document_count
from .config import OPENAI_API_KEY, MODEL_NAME
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import Dict, List, Tuple, Optional
import logging
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Custom prompt template for MCP-specific answers
PROMPT_TEMPLATE = """You are an expert on Model Context Protocol (MCP). Use ONLY the following context to answer the question. If the context doesn't contain relevant information, say "I don't have enough information about that aspect of MCP."

Context:
-------------------
{context}
-------------------

Question: {question}

Requirements for your answer:
1. Be concise and direct
2. Use maximum 3-4 paragraphs
3. If code examples are needed, keep them short
4. Only discuss MCP-related topics
5. Format in markdown
6. Maximum response length: 400 words

Answer: Let me explain this aspect of MCP."""

def is_mcp_related(question: str) -> bool:
    """Check if the question is related to MCP."""
    mcp_keywords = [
        'mcp', 'model context protocol', 'claude desktop', 
        'anthropic', 'context protocol', 'mcp server', 
        'mcp client', 'mcp host'
    ]
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in mcp_keywords)

def truncate_documents(docs: List[dict], max_length: int = 4000) -> str:
    """Truncate and combine documents to fit within token limit."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    combined_text = ""
    for doc in docs:
        if len(combined_text) + len(doc.page_content) > max_length:
            remaining_length = max_length - len(combined_text)
            if remaining_length > 0:
                # Add a portion of the next document if space allows
                combined_text += doc.page_content[:remaining_length]
            break
        combined_text += doc.page_content + "\n\n"
    
    return combined_text

# Initialize LLM with better settings for technical Q&A
llm = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,
    model_name=MODEL_NAME,
    temperature=0.2,  # Lower temperature for more focused answers
    max_tokens=800,   # Limit response length
    streaming=True
)

# Build RAG pipeline
store = get_vector_store()
retriever = store.as_retriever(
    search_kwargs={
        "k": 3,  # Reduced from 4 to 3 for context length
        "fetch_k": 5  # Reduced from 8 to 5
    }
)
prompt = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True,
    chain_type_kwargs={
        "prompt": prompt,
        "verbose": True
    }
)

def format_sources(sources: List[str]) -> str:
    """Format source URLs into a markdown list with deduplication."""
    unique_sources = list(dict.fromkeys(sources))[:3]  # Limit to top 3 sources
    if not unique_sources:
        return ""
    
    source_list = "\n\n**Sources:**\n"
    for source in unique_sources:
        source_list += f"- {source}\n"
    return source_list

def answer_question(question: str) -> Tuple[str, Optional[str]]:
    """
    Given a user question, retrieve relevant docs and generate an answer with sources.
    Returns: (answer, formatted_sources)
    """
    try:
        # Check if question is MCP-related
        if not is_mcp_related(question):
            return ("I can only answer questions related to the Model Context Protocol (MCP). Please rephrase your question to focus on MCP-specific topics.", None)

        # Check if we have documents in the vector store
        doc_count = get_document_count()
        logger.info(f"Current document count in vector store: {doc_count}")
        
        if doc_count == 0:
            logger.warning("No documents found in vector store!")
            return ("I apologize, but I don't have any MCP documentation loaded yet. Please run the ingestion process first.", None)

        # Get answer from RAG chain
        logger.info(f"Retrieving documents for question: {question}")
        
        # Get documents and truncate them to fit context window
        docs = retriever.get_relevant_documents(question)
        truncated_context = truncate_documents(docs)
        
        # Get answer using truncated context
        result = qa_chain({"query": question, "context": truncated_context})
        
        # Log retrieved documents
        logger.info("Retrieved documents:")
        for idx, doc in enumerate(result.get("source_documents", [])):
            logger.info(f"Document {idx + 1}:")
            logger.info(f"Content: {doc.page_content[:150]}...")  # Reduced from 200 to 150
            logger.info(f"Source: {doc.metadata.get('source', 'No source')}")
            
        answer = result["result"]
        
        # Extract and format sources
        sources = []
        for doc in result.get("source_documents", []):
            meta = doc.metadata
            if "source" in meta:
                sources.append(meta["source"])
        
        formatted_sources = format_sources(sources) if sources else None
        logger.info(f"Number of sources found: {len(sources) if sources else 0}")
        
        # Combine answer with sources if available
        if formatted_sources:
            full_response = f"{answer}\n{formatted_sources}"
        else:
            full_response = answer
            
        return full_response, formatted_sources
        
    except Exception as e:
        logger.error(f"Error in answer_question: {str(e)}", exc_info=True)
        error_msg = f"An error occurred while processing your question: {str(e)}"
        return error_msg, None
