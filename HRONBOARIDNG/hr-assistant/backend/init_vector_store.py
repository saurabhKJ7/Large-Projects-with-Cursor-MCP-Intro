import os
import json
import faiss

# Create vector store directory structure
os.makedirs("vector_db/metadata/documents", exist_ok=True)

# Create initial FAISS index
index = faiss.IndexFlatL2(1536)
faiss.write_index(index, "vector_db/faiss_index")

# Create empty chunk IDs file
with open("vector_db/chunk_ids.json", "w") as f:
    json.dump([], f)

print("Vector store initialized successfully!") 