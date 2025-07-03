from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import io
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__, static_folder='.')
CORS(app) # Enable CORS for all routes

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except Exception:
    nltk.download('punkt')

def extract_text_from_pdf(pdf_file):
    text = ""
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        for page_num in range(len(reader.pages)):
            text += reader.pages[page_num].extract_text() or ""
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None
    return text

def chunk_fixed_size(text, chunk_size, overlap):
    words = word_tokenize(text)
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i + chunk_size]
        chunks.append({
            "text": " ".join(chunk),
            "metadata": {"size": len(chunk), "overlap": overlap}
        })
        i += chunk_size - overlap
    return chunks

def chunk_sentence_based(text):
    sentences = sent_tokenize(text)
    chunks = []
    for i, sentence in enumerate(sentences):
        chunks.append({
            "text": sentence,
            "metadata": {"type": "sentence", "index": i}
        })
    return chunks

def chunk_recursive(text, max_chunk_size=500, overlap=50):
    print(f"[chunk_recursive] text length: {len(text)}, max_chunk_size: {max_chunk_size}, overlap: {overlap}")
    chunks = []
    start_index = 0
    text_len = len(text)

    while start_index < text_len:
        # Determine the end of the potential chunk
        end_index_candidate = min(start_index + max_chunk_size, text_len)
        
        # Get the segment to find a natural split point
        segment_to_search = text[start_index:end_index_candidate]
        
        split_at = -1 # Index relative to start_index
        
        # Try to find a natural split point (e.g., end of a sentence or paragraph)
        # Search backwards from the end of the segment
        last_dot = segment_to_search.rfind('.', 0, len(segment_to_search))
        if last_dot != -1:
            split_at = last_dot + 1 # Include the dot

        if split_at == -1:
            last_newline = segment_to_search.rfind('\n', 0, len(segment_to_search))
            if last_newline != -1:
                split_at = last_newline + 1 # Include the newline

        # If no natural split found, or if the natural split is too early (e.g., only a few chars)
        # Fallback to max_chunk_size, but ensure it's at least a reasonable size
        # If the segment is smaller than max_chunk_size, take the whole segment
        if split_at == -1 or (split_at < max_chunk_size * 0.5 and len(segment_to_search) == max_chunk_size):
            # If no good split point, just take the max_chunk_size or remaining text
            chunk_length = len(segment_to_search)
        else:
            chunk_length = split_at

        # Ensure chunk_length is at least 1 to prevent infinite loops with empty chunks
        if chunk_length == 0 and start_index < text_len:
            chunk_length = 1 # Force a minimum chunk size if no content is found

        chunk_content = text[start_index : start_index + chunk_length]
        
        if not chunk_content.strip() and start_index + chunk_length < text_len: # Skip empty chunks unless it's the very end
            start_index += chunk_length
            continue

        chunks.append({"text": chunk_content, "metadata": {"size": len(chunk_content), "overlap": overlap}})
        print(f"[chunk_recursive] Added chunk, length: {len(chunk_content)}")

        # Calculate the start of the next chunk
        # Ensure we always advance by at least 1 character to prevent infinite loops
        next_start_index = start_index + chunk_length - overlap
        
        # Ensure next_start_index always moves forward and doesn't go past text_len
        if next_start_index <= start_index:
            next_start_index = start_index + chunk_length # No overlap, just move past current chunk
            if next_start_index == start_index: # If chunk_length was 0 or 1 and overlap was 1
                next_start_index += 1 # Force advance by at least 1
        
        start_index = next_start_index
        print(f"[chunk_recursive] Next start_index: {start_index}, Remaining text length: {text_len - start_index}")

    print(f"[chunk_recursive] Total chunks: {len(chunks)}")
    return chunks

def chunk_semantic(text, threshold=0.7):
    sentences = sent_tokenize(text)
    if not sentences: return []

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(sentences)

    chunks = []
    current_chunk_sentences = [sentences[0]]

    for i in range(1, len(sentences)):
        # Calculate similarity between current sentence and the last sentence of the current chunk
        # Or, more robustly, between current sentence and the average vector of the current chunk
        
        # For simplicity, let's compare current sentence with the previous one
        similarity = cosine_similarity(tfidf_matrix[i], tfidf_matrix[i-1])[0][0]
        
        if similarity > threshold:
            current_chunk_sentences.append(sentences[i])
        else:
            chunks.append({"text": " ".join(current_chunk_sentences), "metadata": {"type": "semantic", "num_sentences": len(current_chunk_sentences)}})
            current_chunk_sentences = [sentences[i]]
    
    if current_chunk_sentences:
        chunks.append({"text": " ".join(current_chunk_sentences), "metadata": {"type": "semantic", "num_sentences": len(current_chunk_sentences)}})
    
    return chunks

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400

    pdf_file = request.files['pdf']
    if pdf_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if pdf_file:
        text = extract_text_from_pdf(io.BytesIO(pdf_file.read()))
        if text is None:
            return jsonify({'error': 'Could not process PDF'}), 500
        return jsonify({'text': text}), 200

@app.route('/chunk', methods=['POST'])
def chunk_text():
    data = request.get_json()
    text = data.get('text')
    strategy = data.get('strategy')
    chunk_size = data.get('chunk_size', 100) # Default for fixed-size
    overlap = data.get('overlap', 20)       # Default for fixed-size
    threshold = data.get('threshold', 0.7)   # Default for semantic

    if not text or not strategy:
        return jsonify({'error': 'Missing text or strategy'}), 400

    chunks = []
    explanation = ""

    try:
        if strategy == 'fixed_size':
            chunks = chunk_fixed_size(text, int(chunk_size), int(overlap))
            explanation = f"Splits text into chunks of {chunk_size} words with an overlap of {overlap} words."
        elif strategy == 'sentence_based':
            chunks = chunk_sentence_based(text)
            explanation = "Splits text into individual sentences. Each sentence forms a chunk."
        elif strategy == 'recursive':
            chunks = chunk_recursive(text, int(chunk_size), int(overlap))
            explanation = f"Recursively splits text, attempting to find natural break points (like sentences or paragraphs) before falling back to fixed size. Max chunk size: {chunk_size}, overlap: {overlap}."
        elif strategy == 'semantic':
            chunks = chunk_semantic(text, float(threshold))
            explanation = f"Groups semantically similar sentences together into chunks based on TF-IDF cosine similarity with a threshold of {threshold}."
        else:
            return jsonify({'error': 'Invalid chunking strategy'}), 400

        print(f"[chunk_text] Chunks generated: {len(chunks)}")
        print(f"[chunk_text] Explanation: {explanation}")
        return jsonify({'chunks': chunks, 'explanation': explanation}), 200
    except Exception as e:
        print(f"Error during chunking: {e}")
        return jsonify({'error': f'Error during chunking: {str(e)}'}), 500

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)