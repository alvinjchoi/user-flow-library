FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV, UIED, and git
RUN apt-get update && apt-get install -y \
    git \
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

# Clone UIED repository
RUN git clone https://github.com/MulongXie/UIED.git UIED && \
    echo "✅ UIED cloned successfully"

# Patch UIED for Python 3.10+ compatibility (time.clock() was removed)
RUN find UIED -name "*.py" -type f -exec sed -i 's/time\.clock()/time.perf_counter()/g' {} + && \
    echo "✅ UIED patched for Python 3.10+ compatibility"

# Clone ScreenCoder repository for layout generation
RUN git clone https://github.com/leigest519/ScreenCoder.git ScreenCoder && \
    echo "✅ ScreenCoder cloned successfully"

# Copy application code
COPY . .

# Expose port (dynamic for Render)
EXPOSE $PORT

# Run the application using environment PORT variable
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5000}"

