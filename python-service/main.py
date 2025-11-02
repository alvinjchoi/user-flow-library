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
    Detect UI elements from a screenshot using UIED

    This endpoint:
    1. Downloads the image from URL
    2. Runs UIED component detection
    3. Optionally extracts text labels with OCR
    4. Converts pixel coordinates to percentages
    5. Returns formatted results
    """
    try:
        from uied_detector import get_detector

        # Get detector instance
        detector = get_detector()

        # Run detection with OCR option
        result = detector.detect(
            str(request.imageUrl),
            include_labels=request.includeLabels
        )

        # Filter by confidence
        filtered_elements = [
            DetectedElement(**elem)
            for elem in result['elements']
            if elem['confidence'] >= request.minConfidence
        ]

        return DetectionResponse(
            elements=filtered_elements,
            imageWidth=result['imageWidth'],
            imageHeight=result['imageHeight']
        )

    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"UIED not properly installed: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_detail = f"Detection failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-layout")
async def generate_layout(request: DetectionRequest):
    """
    Generate HTML/CSS layout from a screenshot using ScreenCoder's methodology
    
    This endpoint uses ScreenCoder's actual implementation:
    1. Block Parsing: Identify major layout blocks (header, sidebar, navigation, main content)
    2. HTML Generation: Generate HTML/CSS for each block using GPT-4 Vision
    3. Layout Assembly: Combine blocks into complete page structure
    4. Returns production-ready HTML with Tailwind CSS
    """
    try:
        from screencoder_wrapper import get_generator
        
        # Get OpenAI API key from environment
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            raise HTTPException(
                status_code=503,
                detail="OPENAI_API_KEY not configured. Layout generation requires OpenAI API access."
            )
        
        # Get ScreenCoder generator instance
        generator = get_generator(openai_api_key)
        
        # Generate layout using ScreenCoder's approach
        result = generator.generate_layout(
            str(request.imageUrl),
            include_full_page=True
        )
        
        return result
        
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"ScreenCoder not properly installed: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_detail = f"Layout generation failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Detailed health check with UIED and ScreenCoder availability"""
    uied_available = False
    screencoder_available = False
    openai_configured = bool(os.getenv('OPENAI_API_KEY'))
    error_message = None
    
    try:
        # Check if UIED modules can be imported
        import sys
        from pathlib import Path
        UIED_PATH = Path(__file__).parent / "UIED"
        SCREENCODER_PATH = Path(__file__).parent / "ScreenCoder"
        
        if UIED_PATH.exists():
            sys.path.insert(0, str(UIED_PATH))
            from detect_compo.ip_region_proposal import compo_detection
            uied_available = True
        
        # Check ScreenCoder
        if SCREENCODER_PATH.exists():
            screencoder_available = True
            
    except Exception as e:
        error_message = str(e)
    
    return {
        "status": "healthy" if (uied_available and screencoder_available) else "degraded",
        "uied_available": uied_available,
        "screencoder_available": screencoder_available,
        "openai_configured": openai_configured,
        "layout_generation_available": screencoder_available and openai_configured,
        "error": error_message,
        "note": "OCR removed - use /generate-layout for text recognition"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)


