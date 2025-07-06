import streamlit as st
import requests
import json
from typing import List, Dict
import os

# Configure page
st.set_page_config(
    page_title="Research Assistant",
    page_icon="📚",
    layout="wide"
)

# Constants
API_URL = "http://localhost:8000"

# Custom CSS
st.markdown("""
<style>
    .main {
        padding: 2rem;
    }
    .stTextInput > div > div > input {
        padding: 0.5rem;
    }
    .source-box {
        background-color: #f0f2f6;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    .citation {
        color: #0066cc;
        font-weight: bold;
    }
    .confidence {
        color: #28a745;
    }
    .source-title {
        font-weight: bold;
        color: #1e1e1e;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'uploaded_files' not in st.session_state:
    st.session_state.uploaded_files = []
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

# Title and description
st.title("📚 Research Assistant")
st.markdown("""
This AI-powered research assistant helps you find answers by combining information from your uploaded PDFs 
and real-time web search. Get comprehensive, well-cited answers to your questions.
""")

# Sidebar for file upload and settings
with st.sidebar:
    st.header("📁 Document Upload")
    uploaded_file = st.file_uploader("Upload PDF", type="pdf")
    
    if uploaded_file:
        files = {"file": uploaded_file}
        response = requests.post(f"{API_URL}/upload", files=files)
        
        if response.status_code == 200:
            doc_info = response.json()
            if doc_info["document_id"] not in [f["document_id"] for f in st.session_state.uploaded_files]:
                st.session_state.uploaded_files.append(doc_info)
                st.success(f"Uploaded: {doc_info['title']}")
        else:
            st.error("Error uploading file")
    
    st.header("🔍 Search Settings")
    search_mode = st.radio(
        "Search Mode",
        ["Hybrid", "PDF Only", "Web Only"],
        help="Choose where to search for answers"
    )
    
    st.header("📚 Uploaded Documents")
    for doc in st.session_state.uploaded_files:
        st.markdown(f"- {doc['title']} ({doc['total_pages']} pages)")

# Main chat interface
st.header("💬 Ask Questions")

# Query input
query = st.text_input("Enter your question")

if st.button("Search", key="search"):
    if query:
        with st.spinner("Searching for answers..."):
            # Prepare request
            request_data = {
                "query": query,
                "pdf_only": search_mode == "PDF Only",
                "web_only": search_mode == "Web Only"
            }
            
            # Make API request
            response = requests.post(
                f"{API_URL}/query",
                json=request_data
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Add to chat history
                st.session_state.chat_history.append({
                    "query": query,
                    "response": result
                })
            else:
                st.error("Error getting response")

# Display chat history
for item in reversed(st.session_state.chat_history):
    st.markdown("---")
    
    # Question
    st.markdown(f"**Q:** {item['query']}")
    
    # Answer with citations
    st.markdown(f"**A:** {item['response']['answer']}")
    
    # Confidence score
    confidence = item['response']['confidence_score']
    st.markdown(f"**Confidence Score:** <span class='confidence'>{confidence:.2f}</span>", unsafe_allow_html=True)
    
    # Sources
    st.markdown("**Sources:**")
    cols = st.columns(2)
    
    # Split sources into PDF and web
    pdf_sources = [s for s in item['response']['sources'] if s['type'] == 'pdf']
    web_sources = [s for s in item['response']['sources'] if s['type'] == 'web']
    
    # PDF sources
    with cols[0]:
        st.markdown("📄 **PDF Sources**")
        for source in pdf_sources:
            with st.container():
                st.markdown(f"""
                <div class='source-box'>
                    <span class='citation'>[{source['id']}]</span>
                    <p>Page {source['page']}</p>
                    <p>{source['text']}</p>
                    <p><em>Relevance: {source['score']}</em></p>
                </div>
                """, unsafe_allow_html=True)
    
    # Web sources
    with cols[1]:
        st.markdown("🌐 **Web Sources**")
        for source in web_sources:
            with st.container():
                st.markdown(f"""
                <div class='source-box'>
                    <span class='citation'>[{source['id']}]</span>
                    <p class='source-title'>{source['title']}</p>
                    <p>{source['snippet']}</p>
                    <p><a href="{source['url']}" target="_blank">View Source</a></p>
                    <p><em>Published: {source['date']}</em></p>
                </div>
                """, unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center'>
    <p>Built with ❤️ using FastAPI, Streamlit, and OpenAI</p>
</div>
""", unsafe_allow_html=True) 