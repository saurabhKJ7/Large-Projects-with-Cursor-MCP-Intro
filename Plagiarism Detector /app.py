import os
from flask import Flask, request, render_template
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from dotenv import load_dotenv
import openai

load_dotenv()

app = Flask(__name__)

# Load models
# You can add more models here
models = {
    "sentence-transformers/all-MiniLM-L6-v2": SentenceTransformer('all-MiniLM-L6-v2'),
    "openai": None # Initialize OpenAI client later if API key is available
}

def get_embedding(text, model_name):
    if model_name.startswith("sentence-transformers"):
        return models[model_name].encode(text)
    elif model_name == "openai":
        # Ensure OpenAI API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY not set in environment variables.")
        try:
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.embeddings.create(input=[text], model="text-embedding-ada-002")
            return response.data[0].embedding
        except Exception as e:
            print(f"Error getting OpenAI embedding: {e}")
            return None
    return None

def calculate_similarity_matrix(texts, selected_model):
    embeddings = []
    valid_texts = []
    for text in texts:
        embedding = get_embedding(text, selected_model)
        if embedding is not None:
            embeddings.append(embedding)
            valid_texts.append(text)
    
    if not embeddings:
        return None, []

    embeddings_array = np.array(embeddings)
    similarity_matrix = cosine_similarity(embeddings_array)
    return similarity_matrix, valid_texts

@app.route('/', methods=['GET', 'POST'])
def index():
    similarity_matrix = None
    texts = []
    valid_texts = [] # Initialize valid_texts
    selected_model = list(models.keys())[0] # Default to the first model
    clone_pairs = []
    highlight_pairs = [] # To store (min_idx, max_idx) for highlighting
    error_message = None

    if request.method == 'POST':
        texts = [request.form[f'text{i}'] for i in range(1, 6) if request.form[f'text{i}']] # Up to 5 text inputs
        selected_model = request.form.get('model_select', selected_model)
        threshold = float(request.form.get('threshold', 0.8)) # Default threshold 80%

        if not texts:
            error_message = "Please enter at least one text for comparison."
        else:
            try:
                similarity_matrix, valid_texts = calculate_similarity_matrix(texts, selected_model)
                if similarity_matrix is not None:
                    # Identify clone pairs
                    for i in range(len(valid_texts)):
                        for j in range(i + 1, len(valid_texts)):
                            if similarity_matrix[i, j] > threshold:
                                clone_pairs.append((i, j, similarity_matrix[i, j]))
                                highlight_pairs.append(tuple(sorted((i, j)))) # Store sorted tuple for easy lookup
                else:
                    error_message = "Could not generate embeddings for the provided texts with the selected model. Please check your input or API key." # similarity_matrix is already None
            except ValueError as e:
                error_message = str(e)
            except Exception as e:
                error_message = f"An unexpected error occurred: {e}"

    return render_template('index.html',
                           similarity_matrix=similarity_matrix,
                           texts=texts,
                           display_texts=valid_texts,
                           model_names=models.keys(),
                           selected_model=selected_model,
                           clone_pairs=list(clone_pairs),
                           highlight_pairs=highlight_pairs,
                           error_message=error_message)

if __name__ == '__main__':
    app.run(debug=True)