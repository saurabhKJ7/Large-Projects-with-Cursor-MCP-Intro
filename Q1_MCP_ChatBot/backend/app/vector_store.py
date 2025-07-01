import os
from langchain_community.vectorstores import FAISS, Chroma
from langchain_openai import OpenAIEmbeddings
from .config import DATA_DIR, VECTOR_DB_TYPE, OPENAI_API_KEY

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Initialize embeddings
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

VECTOR_DB_PATH = os.path.join(DATA_DIR, "vector_db")

def get_vector_store():
    """
    Get or create the vector store.
    Returns an instance of FAISS or Chroma vector store.
    """
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        
        if VECTOR_DB_TYPE == "faiss":
            if os.path.exists(VECTOR_DB_PATH):
                print(f"Loading existing FAISS vector store from {VECTOR_DB_PATH}")
                return FAISS.load_local(
                    VECTOR_DB_PATH, 
                    embeddings,
                    allow_dangerous_deserialization=True  # Safe since we created this file
                )
            else:
                print("Creating new FAISS vector store")
                return FAISS.from_texts(["placeholder"], embeddings)  # Initialize with placeholder
        elif VECTOR_DB_TYPE == "chroma":
            print(f"Using Chroma vector store at {VECTOR_DB_PATH}")
            return Chroma(persist_directory=VECTOR_DB_PATH, embedding_function=embeddings)
        else:
            raise ValueError(f"Unsupported VECTOR_DB_TYPE: {VECTOR_DB_TYPE}")
    except Exception as e:
        print(f"Error initializing vector store: {str(e)}")
        raise

def save_vector_store(store):
    """
    Save the vector store to disk.
    Args:
        store: FAISS or Chroma vector store instance
    """
    try:
        if not store:
            raise ValueError("Vector store is None")
            
        if VECTOR_DB_TYPE == "faiss":
            print(f"Saving FAISS vector store to {VECTOR_DB_PATH}")
            store.save_local(VECTOR_DB_PATH)
        elif VECTOR_DB_TYPE == "chroma":
            print("Persisting Chroma vector store")
            store.persist()
        print("Vector store saved successfully")
    except Exception as e:
        print(f"Error saving vector store: {str(e)}")
        raise

def get_document_count():
    """
    Get the number of documents in the vector store.
    Returns: The number of documents, or 0 if the store does not exist.
    """
    if not os.path.exists(VECTOR_DB_PATH):
        return 0

    try:
        if VECTOR_DB_TYPE == "faiss":
            faiss_store = FAISS.load_local(VECTOR_DB_PATH, embeddings, allow_dangerous_deserialization=True)
            return faiss_store.index.ntotal
        elif VECTOR_DB_TYPE == "chroma":
            chroma_store = Chroma(persist_directory=VECTOR_DB_PATH, embedding_function=embeddings)
            return chroma_store._collection.count()
        else:
            print(f"Unsupported VECTOR_DB_TYPE: {VECTOR_DB_TYPE}")
            return 0
    except Exception as e:
        print(f"Error getting document count: {str(e)}")
        return 0
