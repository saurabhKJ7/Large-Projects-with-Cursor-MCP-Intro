import os
import requests
from lxml import etree
from tqdm import tqdm
from langchain_community.document_loaders import SitemapLoader
from .config import URLS_FILE, DATA_DIR
from .vector_store import get_vector_store, save_vector_store

def get_sitemap_urls(sitemap_url):
    try:
        response = requests.get(sitemap_url)
        response.raise_for_status()
        root = etree.fromstring(response.content)
        urls = [elem.text for elem in root.findall(".//{*}loc")]
        return urls
    except Exception as e:
        print(f"Failed to fetch or parse sitemap for {sitemap_url}: {e}")
        return []

def process_url(url, loader_class=SitemapLoader):
    """Helper function to process a single URL with error handling"""
    try:
        loader = loader_class(url)
        loaded_docs = loader.load()
        if not loaded_docs:
            print(f"Warning: No documents loaded from {url}")
            return []
        print(f"Successfully loaded {len(loaded_docs)} documents from {url}")
        return loaded_docs
    except Exception as e:
        print(f"Error loading {url}: {str(e)}")
        return []

def run_ingestion():
    """
    Loads all documentation from sitemaps and ingests into the vector DB.
    """
    try:
        # First try the main MCP documentation sitemap
        mcp_sitemap = "https://modelcontextprotocol.io/sitemap.xml"
        print(f"Attempting to load MCP documentation from {mcp_sitemap}")
        docs = []
        
        # Try the main MCP sitemap first
        mcp_urls = get_sitemap_urls(mcp_sitemap)
        if mcp_urls:
            print(f"Found {len(mcp_urls)} URLs from sitemap: {mcp_sitemap}")
            try:
                mcp_docs = process_url(mcp_sitemap)
                if mcp_docs:
                    docs.extend(mcp_docs)
            except Exception as e:
                print(f"Error processing MCP sitemap: {e}")

        # Process additional URLs
        additional_urls = [
            "https://docs.anthropic.com/en/home",
            "https://www.datacamp.com/tutorial/mcp-model-context-protocol",
            "https://www.philschmid.de/mcp-introduction",
            "https://pieces.app/blog/mcp",
            "https://wandb.ai/onlineinference/mcp/reports/The-Model-Context-Protocol-MCP-by-Anthropic-Origins-functionality-and-impact--VmlldzoxMTY5NDI4MQ",
            "https://stackoverflow.com/questions/tagged/model-context-protocol",
            "https://openai.github.io/openai-agents-python/mcp/",
            "https://www.infoq.com/news/2024/12/anthropic-model-context-protocol/",
            "https://devblogs.microsoft.com/blog/microsoft-partners-with-anthropic-to-create-official-c-sdk-for-model-context-protocol",
            "https://en.wikipedia.org/wiki/Model_Context_Protocol"
        ]

        # Process each additional URL
        for url in tqdm(additional_urls, desc="Processing additional URLs"):
            try:
                url_docs = process_url(url)
                if url_docs:
                    docs.extend(url_docs)
            except Exception as e:
                print(f"Error processing {url}: {e}")
                continue

        print(f"Total documents collected: {len(docs)}")
        print(f"DATA_DIR: {DATA_DIR}")
        print(f"VECTOR_DB_PATH from config: {os.path.join(DATA_DIR, 'vector_db')}")

        if not docs:
            print("No documents were loaded. Stopping ingestion.")
            return

        # Store in vector DB
        try:
            store = get_vector_store()
            print(f"Vector store initialized. Type: {type(store)}")
            
            print(f"Attempting to add {len(docs)} documents to vector store...")
            store.add_documents(docs)
            
            print("Saving vector store...")
            save_vector_store(store)
            
            print(f"Successfully ingested {len(docs)} documents.")
        except Exception as e:
            print(f"Error during vector store operations: {str(e)}")
            raise

    except Exception as e:
        print(f"An unexpected error occurred during ingestion: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_ingestion()

    
    