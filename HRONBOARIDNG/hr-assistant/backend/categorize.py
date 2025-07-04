import os
import re
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Define HR policy categories
HR_CATEGORIES = [
    "leave",
    "benefits",
    "compensation",
    "conduct",
    "discipline",
    "communication",
    "termination",
    "recruitment",
    "privacy",
    "general"
]

def categorize_query(query: str) -> str:
    """
    Categorize a user query into one of the predefined HR categories
    
    Args:
        query: The user's question
        
    Returns:
        The predicted category
    """
    # Use few-shot prompting with OpenAI to categorize the query
    system_prompt = """
    You are an HR query classifier. Your task is to categorize HR-related questions into one of the following categories:
    - leave: Questions about vacation, sick leave, parental leave, time off
    - benefits: Questions about health insurance, retirement plans, wellness programs
    - compensation: Questions about salary, bonuses, raises, payment schedules
    - conduct: Questions about workplace behavior, dress code, ethics
    - discipline: Questions about warnings, performance improvement, consequences
    - communication: Questions about email, social media, internal communications
    - termination: Questions about resignation, firing, notice periods, exit interviews
    - recruitment: Questions about hiring, interviews, job applications
    - privacy: Questions about personal data, confidentiality
    - general: Other HR questions that don't fit the above categories
    
    Respond with ONLY the category name, nothing else.
    """
    
    examples = [
        {"role": "user", "content": "How many vacation days do I get per year?"},
        {"role": "assistant", "content": "leave"},
        
        {"role": "user", "content": "What is the company's health insurance plan?"},
        {"role": "assistant", "content": "benefits"},
        
        {"role": "user", "content": "When do we get paid each month?"},
        {"role": "assistant", "content": "compensation"},
        
        {"role": "user", "content": "What is the dress code for the office?"},
        {"role": "assistant", "content": "conduct"},
        
        {"role": "user", "content": "What happens if I'm late to work repeatedly?"},
        {"role": "assistant", "content": "discipline"},
        
        {"role": "user", "content": "Can I use social media during work hours?"},
        {"role": "assistant", "content": "communication"},
        
        {"role": "user", "content": "How much notice do I need to give if I resign?"},
        {"role": "assistant", "content": "termination"},
        
        {"role": "user", "content": "What's the interview process like?"},
        {"role": "assistant", "content": "recruitment"},
        
        {"role": "user", "content": "Who has access to my personal information?"},
        {"role": "assistant", "content": "privacy"},
        
        {"role": "user", "content": "Where can I find the employee handbook?"},
        {"role": "assistant", "content": "general"}
    ]
    
    messages = []
    messages.append({"role": "system", "content": system_prompt})
    
    # Add few-shot examples
    for example in examples:
        messages.append(example)
    
    # Add the current query
    messages.append({"role": "user", "content": query})
    
    # Call OpenAI API
    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        temperature=0.3,
        max_tokens=20
    )
    
    category = response.choices[0].message.content.strip().lower()
    
    # Ensure the category is valid
    if category not in HR_CATEGORIES:
        category = "general"
    
    return category

def categorize_document(text: str, filename: str) -> List[str]:
    """
    Categorize an HR document into one or more predefined HR categories
    based on its content and filename
    
    Args:
        text: The extracted text from the document
        filename: The original filename
        
    Returns:
        List of predicted categories
    """
    # Use filename as initial hint for categorization
    initial_categories = []
    filename_lower = filename.lower()
    
    # Check for keywords in filename
    if any(keyword in filename_lower for keyword in ["leave", "vacation", "sick", "absence", "parental"]):
        initial_categories.append("leave")
    
    if any(keyword in filename_lower for keyword in ["benefit", "insurance", "retirement", "pension"]):
        initial_categories.append("benefits")
    
    if any(keyword in filename_lower for keyword in ["salary", "compensation", "pay", "bonus", "contract"]):
        initial_categories.append("compensation")
    
    if any(keyword in filename_lower for keyword in ["conduct", "behavior", "code", "ethics", "social", "media", "communication", "email", "internet"]):
        initial_categories.append("conduct")
        initial_categories.append("communication")
    
    if any(keyword in filename_lower for keyword in ["disciplinary", "discipline", "warning", "performance"]):
        initial_categories.append("discipline")
    
    if any(keyword in filename_lower for keyword in ["termination", "exit", "notice", "period", "resignation", "interview"]):
        initial_categories.append("termination")
    
    if any(keyword in filename_lower for keyword in ["recruitment", "hiring", "interview", "applicant", "job", "offer", "employment"]):
        initial_categories.append("recruitment")
    
    if any(keyword in filename_lower for keyword in ["privacy", "confidential", "data", "personal"]):
        initial_categories.append("privacy")
    
    # If no categories were identified from filename, use OpenAI to analyze content
    if not initial_categories or len(text) > 100:  # Only use API if we have enough text
        # Prepare a sample of the text (first 1000 characters)
        text_sample = text[:1000]
        
        system_prompt = """
        You are an HR document classifier. Your task is to categorize HR documents into one or more of the following categories:
        - leave: Documents about vacation, sick leave, parental leave, time off
        - benefits: Documents about health insurance, retirement plans, wellness programs
        - compensation: Documents about salary, bonuses, raises, payment schedules
        - conduct: Documents about workplace behavior, dress code, ethics
        - discipline: Documents about warnings, performance improvement, consequences
        - communication: Documents about email, social media, internal communications
        - termination: Documents about resignation, firing, notice periods, exit interviews
        - recruitment: Documents about hiring, interviews, job applications
        - privacy: Documents about personal data, confidentiality
        - general: Other HR documents that don't fit the above categories
        
        Respond with ONLY the category names separated by commas, nothing else. You can assign multiple categories if appropriate.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Document filename: {filename}\n\nDocument content sample:\n{text_sample}"}
        ]
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.3,
            max_tokens=50
        )
        
        # Parse the response
        api_categories = response.choices[0].message.content.strip().lower().split(",")
        api_categories = [cat.strip() for cat in api_categories]
        
        # Combine with initial categories
        all_categories = list(set(initial_categories + api_categories))
        
        # Filter to valid categories
        categories = [cat for cat in all_categories if cat in HR_CATEGORIES]
    else:
        categories = initial_categories
    
    # Ensure we have at least one category
    if not categories:
        categories = ["general"]
    
    return categories