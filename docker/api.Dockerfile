# Multi-stage build for Python FastAPI backend
FROM python:3.11-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY apps/api/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM base as production

# Copy application code
COPY apps/api /app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Development stage
FROM base as development

# Install dev dependencies
COPY apps/api/requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy application code
COPY apps/api /app

# Run with hot reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

