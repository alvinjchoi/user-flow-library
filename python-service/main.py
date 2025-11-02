from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional, Dict, Any
import traceback

# Import detection modules
try:
    from uied_detector import UIEDDetector
    UIED_AVAILABLE = True
except Exception as e:
    print(f"Warning: UIED not available: {e}")
    UIED_AVAILABLE = False

try:
    from screencoder_wrapper import ScreenCoderWrapper
    SCREENCODER_AVAILABLE = True
except Exception as e:
    print(f"Warning: ScreenCoder not available: {e}")
    SCREENCODER_AVAILABLE = False

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detectors
uied_detector = UIEDDetector() if UIED_AVAILABLE else None
screencoder = ScreenCoderWrapper() if SCREENCODER_AVAILABLE else None

class DetectRequest(BaseModel):
    imageUrl: str
    includeLabels: bool = True

class LayoutRequest(BaseModel):
    imageUrl: str
    includeFullPage: bool = True

@app.get("/")
async def root():
    return {"message": "UIED Detection Service"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    openai_configured = bool(os.getenv("OPENAI_API_KEY"))
    
    return {
        "status": "healthy",
        "uied_available": UIED_AVAILABLE,
        "screencoder_available": SCREENCODER_AVAILABLE,
        "openai_configured": openai_configured,
        "layout_generation_available": SCREENCODER_AVAILABLE and openai_configured,
        "error": None,
        "note": "OCR removed - use /generate-layout for text recognition"
    }

@app.post("/detect")
async def detect_elements(request: DetectRequest):
    """
    Detect UI elements using UIED
    
    Args:
        imageUrl: URL of the screenshot
        includeLabels: Whether to include text labels (requires OCR)
    
    Returns:
        List of detected UI elements with bounding boxes
    """
    if not UIED_AVAILABLE:
        raise HTTPException(status_code=503, detail="UIED detector not available")
    
    try:
        elements = uied_detector.detect(
            request.imageUrl,
            include_labels=request.includeLabels
        )
        
        return {
            "elements": elements,
            "count": len(elements),
            "method": "uied"
        }
    except Exception as e:
        print(f"Error in /detect: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-components")
async def detect_components(request: DetectRequest):
    """
    Fast component detection using GPT-4o-mini (optimized for hotspots)
    
    This endpoint:
    - Uses single GPT call (fast)
    - Uses GPT-4o-mini (10x cheaper)
    - Returns only bounding boxes (no HTML)
    
    Perfect for hotspot detection!
    """
    if not SCREENCODER_AVAILABLE:
        raise HTTPException(status_code=503, detail="ScreenCoder not available")
    
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")
    
    try:
        # Use fast component detection (no HTML generation)
        result = screencoder.detect_components_fast(request.imageUrl)
        
        return {
            "elements": result["elements"],
            "count": len(result["elements"]),
            "bboxes": result["bboxes"],
            "metadata": result["metadata"],
            "method": "screencoder-fast"
        }
    except Exception as e:
        print(f"Error in /detect-components: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-layout")
async def generate_layout(request: LayoutRequest):
    """
    Generate complete HTML layout using ScreenCoder (slow, for full page generation)
    
    Note: This is slower and more expensive. Use /detect-components for hotspot detection.
    """
    if not SCREENCODER_AVAILABLE:
        raise HTTPException(status_code=503, detail="ScreenCoder not available")
    
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")
    
    try:
        result = screencoder.generate_layout(
            request.imageUrl,
            include_full_page=request.includeFullPage
        )
        
        return result
    except Exception as e:
        print(f"Error in /generate-layout: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
