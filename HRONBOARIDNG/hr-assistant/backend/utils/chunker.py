import re
from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter

def chunk_text(text: str, doc_id: str, source: str, categories: List[str]) -> List[Dict[str, Any]]:
    """
    Split text into chunks using HR-specific rules
    
    Args:
        text: The text to chunk
        doc_id: Document ID
        source: Document source (filename)
        categories: List of document categories
        
    Returns:
        List of chunks with text and metadata
    """
    # Define HR-specific separators for better chunking
    hr_separators = [
        # Section headers
        "\n# ", "\n## ", "\n### ", "\n#### ", "\n##### ", "\n###### ",
        # Numbered sections
        "\n1. ", "\n2. ", "\n3. ", "\n4. ", "\n5. ", "\n6. ", "\n7. ", "\n8. ", "\n9. ",
        # Common HR document section titles
        "\nPOLICY STATEMENT", "\nPURPOSE", "\nSCOPE", "\nRESPONSIBILITIES",
        "\nPROCEDURE", "\nELIGIBILITY", "\nBENEFITS", "\nLEAVE ENTITLEMENT",
        "\nTERMINATION", "\nDISCIPLINARY ACTIONS", "\nCODE OF CONDUCT",
        # Double line breaks often indicate section changes
        "\n\n"
    ]
    
    # Create a text splitter with HR-specific configuration
    text_splitter = RecursiveCharacterTextSplitter(
        separators=hr_separators,
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    
    # Split the text into chunks
    text_chunks = text_splitter.split_text(text)
    
    # Create chunk objects with metadata
    chunks = []
    
    for i, chunk_text in enumerate(text_chunks):
        # Extract section title if present
        section_title = extract_section_title(chunk_text)
        
        # Create chunk with metadata
        chunk = {
            "text": chunk_text,
            "metadata": {
                "doc_id": doc_id,
                "source": source,
                "chunk_id": i,
                "categories": categories,
                "section": section_title
            }
        }
        
        chunks.append(chunk)
    
    return chunks

def extract_section_title(text: str) -> str:
    """
    Extract a section title from the chunk text if present
    
    Args:
        text: Chunk text
        
    Returns:
        Section title or empty string
    """
    # Try to find a section title at the beginning of the chunk
    lines = text.strip().split("\n")
    
    if not lines:
        return ""
    
    first_line = lines[0].strip()
    
    # Check for markdown-style headers
    header_match = re.match(r'^#+\s+(.+)$', first_line)
    if header_match:
        return header_match.group(1)
    
    # Check for numbered sections
    numbered_match = re.match(r'^\d+\.\s+(.+)$', first_line)
    if numbered_match:
        return numbered_match.group(1)
    
    # Check for all caps section titles
    if first_line.isupper() and len(first_line) > 3 and len(first_line) < 50:
        return first_line
    
    # Check for title case section titles (if short enough to be a title)
    if first_line.istitle() and len(first_line.split()) <= 7:
        return first_line
    
    return ""