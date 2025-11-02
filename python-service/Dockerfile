FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and UIED
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (dynamic for Render)
EXPOSE $PORT

# Run the application using environment PORT variable
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5000}"

