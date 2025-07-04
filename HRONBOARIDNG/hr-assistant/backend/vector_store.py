import os
import json
import shutil
from typing import List, Dict, Any, Optional
from openai import OpenAI
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Choose vector database implementation
VECTOR_DB_TYPE = os.getenv("VECTOR_DB_TYPE", "FAISS").upper()  # Options: "FAISS" or "CHROMA"

if VECTOR_DB_TYPE == "FAISS":
    import faiss
else:  # CHROMA
    import chromadb
    from chromadb.utils import embedding_functions

# Define paths
VECTOR_DB_PATH = "vector_db"
METADATA_PATH = os.path.join(VECTOR_DB_PATH, "metadata")

# Create necessary directories
os.makedirs(VECTOR_DB_PATH, exist_ok=True)
os.makedirs(METADATA_PATH, exist_ok=True)

# Initialize vector database
if VECTOR_DB_TYPE == "FAISS":
    # Check if index exists, if not create a new one
    INDEX_PATH = os.path.join(VECTOR_DB_PATH, "faiss_index")
    
    if os.path.exists(INDEX_PATH):
        index = faiss.read_index(INDEX_PATH)
        # Load chunk IDs
        with open(os.path.join(VECTOR_DB_PATH, "chunk_ids.json"), "r") as f:
            chunk_ids = json.load(f)
    else:
        # Create a new index - using dimension 1536 for OpenAI text-embedding-3-small
        index = faiss.IndexFlatL2(1536)  
        chunk_ids = []
        
        # Save empty index and chunk IDs
        faiss.write_index(index, INDEX_PATH)
        with open(os.path.join(VECTOR_DB_PATH, "chunk_ids.json"), "w") as f:
            json.dump(chunk_ids, f)
            
else:  # CHROMA
    # Initialize ChromaDB client
    chroma_client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
    
    # Create or get collection
    openai_ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=os.getenv("OPENAI_API_KEY"),
        model_name="text-embedding-3-small"
    )
    
    try:
        collection = chroma_client.get_collection(name="hr_documents", embedding_function=openai_ef)
    except:
        collection = chroma_client.create_collection(name="hr_documents", embedding_function=openai_ef)

def generate_embedding(text: str) -> List[float]:
    """
    Generate an embedding for the given text using OpenAI's embedding model
    
    Args:
        text: The text to embed
        
    Returns:
        The embedding vector
    """
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
        encoding_format="float"
    )
    
    return response.data[0].embedding

def store_document_chunks(chunks: List[Dict[str, Any]]) -> bool:
    """
    Store document chunks in the vector database
    
    Args:
        chunks: List of chunks with text and metadata
        
    Returns:
        True if successful
    """
    if not chunks:
        return False
    
    if VECTOR_DB_TYPE == "FAISS":
        # Generate embeddings for all chunks
        embeddings = []
        new_chunk_ids = []
        
        for chunk in chunks:
            # Generate embedding
            embedding = generate_embedding(chunk["text"])
            embeddings.append(embedding)
            
            # Generate a unique ID for the chunk
            chunk_id = f"{chunk['metadata']['doc_id']}_{len(chunk_ids) + len(new_chunk_ids)}"
            new_chunk_ids.append(chunk_id)
            
            # Save chunk metadata
            with open(os.path.join(METADATA_PATH, f"{chunk_id}.json"), "w") as f:
                json.dump({
                    "text": chunk["text"],
                    "metadata": chunk["metadata"]
                }, f)
        
        # Convert embeddings to numpy array
        embeddings_array = np.array(embeddings).astype('float32')
        
        # Add to index
        index.add(embeddings_array)
        
        # Update chunk IDs
        chunk_ids.extend(new_chunk_ids)
        
        # Save updated index and chunk IDs
        faiss.write_index(index, INDEX_PATH)
        with open(os.path.join(VECTOR_DB_PATH, "chunk_ids.json"), "w") as f:
            json.dump(chunk_ids, f)
            
    else:  # CHROMA
        # Prepare data for ChromaDB
        ids = []
        texts = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{chunk['metadata']['doc_id']}_{i}"
            ids.append(chunk_id)
            texts.append(chunk["text"])
            metadatas.append(chunk["metadata"])
        
        # Add to collection
        collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
    
    return True

def query_vector_store(query: str, category: Optional[str] = None, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Query the vector database for relevant chunks
    
    Args:
        query: The user's question
        category: Optional category to filter results
        top_k: Number of results to return
        
    Returns:
        List of relevant chunks with text and metadata
    """
    # Generate embedding for the query
    query_embedding = generate_embedding(query)
    
    if VECTOR_DB_TYPE == "FAISS":
        # Convert query embedding to numpy array
        query_embedding_array = np.array([query_embedding]).astype('float32')
        
        # Search the index
        distances, indices = index.search(query_embedding_array, min(top_k * 2, len(chunk_ids)))  # Get more results for filtering
        
        # Get the chunk IDs for the search results
        result_chunk_ids = [chunk_ids[idx] for idx in indices[0] if idx < len(chunk_ids)]
        
        # Load chunk metadata
        results = []
        for chunk_id in result_chunk_ids:
            try:
                with open(os.path.join(METADATA_PATH, f"{chunk_id}.json"), "r") as f:
                    chunk_data = json.load(f)
                    
                    # Filter by category if specified
                    if category and category != "general":
                        chunk_categories = chunk_data["metadata"].get("categories", [])
                        if not chunk_categories or category not in chunk_categories:
                            continue
                    
                    results.append(chunk_data)
                    
                    # Stop once we have enough results
                    if len(results) >= top_k:
                        break
            except:
                continue
                
    else:  # CHROMA
        # Query the collection
        query_params = {
            "query_texts": [query],
            "n_results": top_k
        }
        
        # Add category filter if specified
        if category and category != "general":
            query_params["where"] = {"$contains": category}
            
        query_results = collection.query(**query_params)
        
        # Format results
        results = []
        for i in range(len(query_results["ids"][0])):
            results.append({
                "text": query_results["documents"][0][i],
                "metadata": query_results["metadatas"][0][i]
            })
    
    return results

def add_document_metadata(doc_id: str, metadata: Dict[str, Any]) -> bool:
    """
    Store document metadata
    
    Args:
        doc_id: Document ID
        metadata: Document metadata
        
    Returns:
        True if successful
    """
    try:
        # Create documents directory if it doesn't exist
        docs_path = os.path.join(METADATA_PATH, "documents")
        os.makedirs(docs_path, exist_ok=True)
        
        # Save metadata
        with open(os.path.join(docs_path, f"{doc_id}.json"), "w") as f:
            json.dump(metadata, f)
            
        return True
    except:
        return False

def get_document_list() -> List[Dict[str, Any]]:
    """
    Get list of all documents with metadata
    
    Returns:
        List of document metadata
    """
    docs_path = os.path.join(METADATA_PATH, "documents")
    
    # Create directory if it doesn't exist
    os.makedirs(docs_path, exist_ok=True)
    
    # Return empty list if directory is empty
    if not os.path.exists(docs_path) or not os.listdir(docs_path):
        return []
    
    documents = []
    for filename in os.listdir(docs_path):
        if filename.endswith(".json"):
            try:
                with open(os.path.join(docs_path, filename), "r") as f:
                    metadata = json.load(f)
                    # Add document ID from filename
                    doc_id = os.path.splitext(filename)[0]
                    if 'id' not in metadata:
                        metadata['id'] = doc_id
                    documents.append(metadata)
            except Exception as e:
                print(f"Error reading document metadata {filename}: {str(e)}")
                continue
    
    return documents

def delete_document(doc_id: str) -> bool:
    """
    Delete a document and all its chunks from the vector database
    
    Args:
        doc_id: Document ID
        
    Returns:
        True if successful
    """
    global index, chunk_ids
    try:
        # Delete document metadata
        docs_path = os.path.join(METADATA_PATH, "documents")
        doc_metadata_path = os.path.join(docs_path, f"{doc_id}.json")
        
        if os.path.exists(doc_metadata_path):
            # Get file path to delete the original file
            with open(doc_metadata_path, "r") as f:
                metadata = json.load(f)
                file_path = metadata.get("file_path")
                
                # Delete the original file if it exists
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
            
            # Delete metadata file
            os.remove(doc_metadata_path)
        
        if VECTOR_DB_TYPE == "FAISS":
            # Find all chunks for this document
            doc_chunk_ids = [chunk_id for chunk_id in chunk_ids if chunk_id.startswith(f"{doc_id}_")]
            
            if not doc_chunk_ids:
                return True  # No chunks to delete
            
            # Delete chunk metadata files
            for chunk_id in doc_chunk_ids:
                chunk_path = os.path.join(METADATA_PATH, f"{chunk_id}.json")
                if os.path.exists(chunk_path):
                    os.remove(chunk_path)
            
            # We need to rebuild the index without these chunks
            # This is a limitation of FAISS - we can't easily remove vectors
            
            # Get all remaining chunk IDs
            remaining_chunk_ids = [chunk_id for chunk_id in chunk_ids if not chunk_id.startswith(f"{doc_id}_")]
            
            if not remaining_chunk_ids:
                # No chunks left, create empty index
                new_index = faiss.IndexFlatL2(1536)
                faiss.write_index(new_index, INDEX_PATH)
                with open(os.path.join(VECTOR_DB_PATH, "chunk_ids.json"), "w") as f:
                    json.dump([], f)
                    
                # Update global variables
                index = new_index
                chunk_ids = []
            else:
                # Load embeddings for remaining chunks and rebuild index
                embeddings = []
                valid_chunk_ids = []
                
                for chunk_id in remaining_chunk_ids:
                    chunk_path = os.path.join(METADATA_PATH, f"{chunk_id}.json")
                    if os.path.exists(chunk_path):
                        try:
                            with open(chunk_path, "r") as f:
                                chunk_data = json.load(f)
                                embedding = generate_embedding(chunk_data["text"])
                                embeddings.append(embedding)
                                valid_chunk_ids.append(chunk_id)
                        except:
                            continue
                
                if embeddings:
                    # Create new index
                    new_index = faiss.IndexFlatL2(1536)
                    embeddings_array = np.array(embeddings).astype('float32')
                    new_index.add(embeddings_array)
                    
                    # Save new index and chunk IDs
                    faiss.write_index(new_index, INDEX_PATH)
                    with open(os.path.join(VECTOR_DB_PATH, "chunk_ids.json"), "w") as f:
                        json.dump(valid_chunk_ids, f)
                        
                    # Update global variables
                    index = new_index
                    chunk_ids = valid_chunk_ids
                else:
                    # No valid embeddings, create empty index
                    new_index = faiss.IndexFlatL2(1536)
                    faiss.write_index(new_index, INDEX_PATH)
                    with open(os.path.join(VECTOR_DB_PATH, "chunk_ids.json"), "w") as f:
                        json.dump([], f)
                        
                    # Update global variables
                    index = new_index
                    chunk_ids = []
                
        else:  # CHROMA
            # Delete from ChromaDB collection
            collection.delete(where={"doc_id": doc_id})
        
        return True
    except Exception as e:
        print(f"Error deleting document: {str(e)}")
        return False