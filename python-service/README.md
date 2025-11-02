# Python Service for UIED Integration

This service provides UI element detection using UIED (UI Element Detection).

## Architecture

- **FastAPI** - REST API server
- **UIED** - UI element detection engine
- **pytesseract** - OCR for text labels (optional)

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 5000
```

## API Endpoints

### POST /detect
Detect UI elements from a screenshot

**Request:**
```json
{
  "imageUrl": "https://example.com/screenshot.png"
}
```

**Response:**
```json
{
  "elements": [
    {
      "type": "button",
      "label": "Sign In",
      "boundingBox": { "x": 10, "y": 20, "width": 80, "height": 8 },
      "confidence": 0.95
    }
  ]
}
```

## Deployment

- Local: `uvicorn main:app --port 5000`
- Docker: `docker build -t uied-service . && docker run -p 5000:5000 uied-service`
- Production: Railway/Render/Fly.io
