"""
UIED Detection Service
FastAPI service for UI element detection using UIED
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="UIED Detection Service",
    description="UI Element Detection API for User Flow Library",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class DetectionRequest(BaseModel):
    imageUrl: HttpUrl
    includeLabels: bool = True  # OCR text extraction
    minConfidence: float = 0.7


class BoundingBox(BaseModel):
    x: float  # Percentage 0-100
    y: float  # Percentage 0-100
    width: float  # Percentage 0-100
    height: float  # Percentage 0-100


class DetectedElement(BaseModel):
    type: str  # button, input, text, image, etc.
    label: Optional[str] = None
    description: Optional[str] = None
    boundingBox: BoundingBox
    confidence: float


class DetectionResponse(BaseModel):
    elements: List[DetectedElement]
    imageWidth: int
    imageHeight: int


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "UIED Detection Service",
        "version": "1.0.0"
    }


@app.post("/detect", response_model=DetectionResponse)
async def detect_ui_elements(request: DetectionRequest):
    """
    Detect UI elements from a screenshot
    
    This endpoint downloads the image, runs UIED detection,
    and returns bounding boxes in percentage coordinates.
    """
    try:
        # TODO: Implement UIED detection
        # 1. Download image from URL
        # 2. Run UIED detection
        # 3. Extract text labels with OCR (if requested)
        # 4. Convert coordinates to percentages
        # 5. Return formatted results
        
        # Placeholder response
        return DetectionResponse(
            elements=[
                DetectedElement(
                    type="button",
                    label="Example Button",
                    description="Primary action button",
                    boundingBox=BoundingBox(x=10, y=20, width=80, height=8),
                    confidence=0.95
                )
            ],
            imageWidth=1080,
            imageHeight=1920
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "uied_available": False,  # TODO: Check if UIED is loaded
        "ocr_available": False,   # TODO: Check if pytesseract is available
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

