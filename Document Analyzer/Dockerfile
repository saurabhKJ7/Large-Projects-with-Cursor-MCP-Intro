# Use Python 3.9 as base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NLTK_DATA=/app/nltk_data

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Flask for web app
RUN pip install --no-cache-dir flask

# Copy project files
COPY . .

# Create data directory
RUN mkdir -p data

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt', download_dir='$NLTK_DATA'); nltk.download('stopwords', download_dir='$NLTK_DATA'); nltk.download('vader_lexicon', download_dir='$NLTK_DATA')"

# Generate sample data
RUN python generate_sample_data.py

# Expose ports for MCP server and web app
EXPOSE 8000 5000

# Create entrypoint script
RUN echo '#!/bin/bash\n\
if [ "$1" = "web" ]; then\n\
  exec python web_app_example.py\n\
else\n\
  exec python -m mcp serve server.py\n\
fi' > /app/entrypoint.sh \
    && chmod +x /app/entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command (run MCP server)
CMD ["mcp"]