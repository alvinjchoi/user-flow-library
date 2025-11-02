# UIED Integration Plan for Hotspot Detection

## Overview

Integrate ScreenCoder's UIED (UI Element Detection) engine to dramatically improve hotspot detection accuracy.

**GitHub:** https://github.com/leigest519/ScreenCoder

## Why UIED?

Current issues with GPT-4 Vision:
- ❌ Inaccurate bounding boxes (too large, wrong position)
- ❌ Includes padding/whitespace
- ❌ Not specialized for UI detection
- ❌ Expensive and slow

UIED advantages:
- ✅ 90-95% accuracy for UI element detection
- ✅ Tight, precise bounding boxes
- ✅ Fast (1-2 seconds vs 8-12 seconds)
- ✅ Free and open source
- ✅ Specialized for mobile/web UI

## Architecture Options

### Option A: Replace GPT-4 Vision with UIED (Recommended)

**Pros:**
- Most accurate bounding boxes
- Fastest performance
- No API costs
- Best for hotspot detection

**Cons:**
- Requires Python backend
- No semantic labels (need to add manually)

**Implementation:**
```python
# Python microservice
from UIED import detect_ui_elements

@app.post("/api/detect-ui-elements")
async def detect(image_path: str):
    # 1. Run UIED detection
    result = detect_ui_elements(image_path)
    
    # 2. Convert to hotspot format
    hotspots = []
    for compo in result['compos']:
        hotspots.append({
            'boundingBox': {
                'x': compo['column_min'] / image_width * 100,
                'y': compo['row_min'] / image_height * 100,
                'width': (compo['column_max'] - compo['column_min']) / image_width * 100,
                'height': (compo['row_max'] - compo['row_min']) / image_height * 100,
            },
            'type': map_uied_class_to_type(compo['class']),
            'label': None,  # Extract with OCR or manual
            'confidence': 0.95,
        })
    
    return hotspots
```

### Option B: Hybrid UIED + GPT-4 Vision

**Pros:**
- Best of both worlds
- Accurate boxes from UIED
- Semantic labels from GPT-4
- Better element descriptions

**Cons:**
- More complex
- Still has API costs for GPT-4

**Implementation:**
```typescript
// app/api/screens/[id]/detect-elements/route.ts

export async function POST(request: NextRequest) {
  // 1. Call Python service for UIED detection
  const uiedResults = await fetch('http://localhost:5000/detect-ui-elements', {
    method: 'POST',
    body: JSON.stringify({ imageUrl: screen.screenshot_url }),
  });
  
  const elements = await uiedResults.json();
  
  // 2. Enrich with GPT-4 Vision for labels
  const enriched = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: `Given these UI elements, identify their labels and purposes: ${JSON.stringify(elements)}` },
        { type: "image_url", image_url: { url: screen.screenshot_url } }
      ]
    }]
  });
  
  // 3. Merge results
  return mergeResults(elements, enriched);
}
```

### Option C: Full ScreenCoder Pipeline

**Pros:**
- Gets full HTML structure
- Extract all interactive elements
- Most semantic information

**Cons:**
- Overkill for hotspots
- Slower
- More complex

## Implementation Steps

### Step 1: Setup Python Service (2-3 hours)

1. **Clone ScreenCoder:**
```bash
git clone https://github.com/leigest519/ScreenCoder.git
cd ScreenCoder
pip install -r requirements.txt
```

2. **Create FastAPI service:**
```python
# python-service/main.py
from fastapi import FastAPI
from UIED.run_single import run_single

app = FastAPI()

@app.post("/detect")
async def detect_ui_elements(image_url: str):
    # Download image
    # Run UIED
    # Return results
    pass
```

3. **Deploy:**
```bash
# Local
uvicorn main:app --port 5000

# Docker
docker build -t uied-service .
docker run -p 5000:5000 uied-service

# Vercel/Railway (for production)
```

### Step 2: Update Next.js API (1 hour)

```typescript
// app/api/screens/[id]/detect-elements/route.ts

const UIED_SERVICE_URL = process.env.UIED_SERVICE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  // Call Python UIED service instead of GPT-4
  const response = await fetch(`${UIED_SERVICE_URL}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: screen.screenshot_url }),
  });
  
  const elements = await response.json();
  
  // Convert to our hotspot format
  return NextResponse.json({ elements });
}
```

### Step 3: Add OCR for Labels (Optional, 1 hour)

```python
# python-service/main.py
import pytesseract
from PIL import Image

def extract_text_labels(image, bounding_boxes):
    """Extract text from each detected element"""
    labels = []
    for box in bounding_boxes:
        # Crop element
        cropped = image.crop((box['x'], box['y'], box['x']+box['width'], box['y']+box['height']))
        
        # OCR
        text = pytesseract.image_to_string(cropped).strip()
        labels.append(text or None)
    
    return labels
```

## Testing Strategy

1. **Benchmark Dataset:**
   - 50 mobile screenshots
   - 50 web screenshots
   - Manual ground truth annotations

2. **Metrics:**
   - IoU (Intersection over Union) > 0.8
   - Element type accuracy > 90%
   - Detection recall > 95%

3. **A/B Testing:**
   - Compare UIED vs GPT-4 Vision
   - Measure accuracy, speed, cost

## Deployment Considerations

### Development:
```bash
# Run UIED service locally
python python-service/main.py

# Point Next.js to local service
UIED_SERVICE_URL=http://localhost:5000 pnpm dev
```

### Production:
```bash
# Deploy Python service to Railway/Render
railway up

# Update environment variable
UIED_SERVICE_URL=https://uied-service.railway.app
```

## Cost Analysis

### Current (GPT-4 Vision only):
- $0.01-0.03 per screenshot
- 8-12 seconds per detection
- ~70-80% accuracy

### With UIED:
- $0 (open source)
- 1-2 seconds per detection
- ~90-95% accuracy
- Server cost: ~$5-10/month (Railway/Render)

### With UIED + GPT-4 (labels only):
- $0.005 per screenshot (smaller prompt)
- 3-4 seconds total
- ~95% accuracy

## Next Steps

1. ✅ Document integration plan (this file)
2. ⏭️ Clone ScreenCoder and test UIED locally
3. ⏭️ Create FastAPI wrapper service
4. ⏭️ Update Next.js API to call UIED service
5. ⏭️ Add OCR for text labels (optional)
6. ⏭️ Deploy Python service to production
7. ⏭️ A/B test against current GPT-4 approach

## References

- [ScreenCoder GitHub](https://github.com/leigest519/ScreenCoder)
- [UIED Original Paper](https://arxiv.org/abs/1906.07278)
- [ScreenBench Dataset](https://huggingface.co/datasets/Leigest/ScreenCoder)

