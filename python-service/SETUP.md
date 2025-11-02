# UIED Service Setup Guide

## Quick Start

### 1. Install Python Dependencies

```bash
cd python-service

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Install System Dependencies

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr libgl1-mesa-glx libglib2.0-0
```

**Windows:**
- Download Tesseract: https://github.com/UB-Mannheim/tesseract/wiki

### 3. Setup UIED

```bash
# Clone ScreenCoder (contains UIED)
git clone https://github.com/leigest519/ScreenCoder.git
mv ScreenCoder/UIED ./UIED
rm -rf ScreenCoder

# Or download UIED directly
# The UIED directory should be in python-service/UIED/
```

### 4. Create .env File

```bash
cp config.py .env  # Use config.py as reference
```

Example `.env`:
```
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
UIED_MIN_CONFIDENCE=0.7
ENABLE_OCR=true
```

### 5. Run the Service

```bash
# Development (with auto-reload)
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --port 5000

# Production
uvicorn main:app --host 0.0.0.0 --port 5000 --workers 4
```

### 6. Test the Service

```bash
# Health check
curl http://localhost:5000/

# Detection API
curl -X POST http://localhost:5000/detect \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/screenshot.png"}'
```

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t uied-service .

# Run container
docker run -p 5000:5000 uied-service

# With environment variables
docker run -p 5000:5000 \
  -e ALLOWED_ORIGINS=https://yourapp.com \
  uied-service
```

### Docker Compose (Optional)

```yaml
# docker-compose.yml
version: '3.8'

services:
  uied-service:
    build: ./python-service
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - ALLOWED_ORIGINS=http://localhost:3000
    volumes:
      - ./python-service:/app
```

## Production Deployment

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
cd python-service
railway up
```

### Render

1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
cd python-service
fly launch
fly deploy
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` |
| `UIED_MIN_CONFIDENCE` | Minimum confidence score | `0.7` |
| `ENABLE_OCR` | Enable text extraction | `true` |
| `TEMP_DIR` | Temporary files directory | `./temp` |
| `UIED_OUTPUT_DIR` | UIED output directory | `./output` |

## Troubleshooting

### Import Error: No module named 'UIED'

- Make sure UIED directory is in `python-service/UIED/`
- Check that UIED has `__init__.py` files

### Tesseract not found

- Install tesseract-ocr system package
- Set `TESSERACT_PATH` environment variable

### Port already in use

```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### CORS errors

- Add your frontend URL to `ALLOWED_ORIGINS`
- Check that service is running on expected port

## API Documentation

Once running, visit:
- http://localhost:5000/docs (Swagger UI)
- http://localhost:5000/redoc (ReDoc)

