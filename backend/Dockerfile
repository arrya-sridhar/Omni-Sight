# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Set the working directory
WORKDIR /app

# Install system dependencies needed for OpenCV (libglib2.0-0, libgl1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt /app/

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY src /app/src

# Warm up/cache HuggingFace and YOLO models during build time
# This ensures container starts instantly without network calls
RUN python -c " \
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('clip-ViT-B-32'); \
from ultralytics import YOLO; \
YOLO('yolov8n.pt'); \
"

# Create directories for DB/uploads
RUN mkdir -p /app/data /app/uploads

# Expose server port
EXPOSE 8000

# Run FastAPI app
CMD uvicorn src.main:app --host 0.0.0.0 --port $PORT
