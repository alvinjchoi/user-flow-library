# Hotspot Detection Improvements

## Current Challenge
Accurately identifying and labeling CSS components from screenshots is difficult because:
1. We only have raster images (PNG/JPG), not vector data
2. GPT-4 Vision isn't specialized for UI detection
3. Bounding boxes are often inaccurate (too large, wrong position)
4. Element types are sometimes misidentified

## Immediate Improvements (Phase 1)

### 1. Enhanced Prompting ✅
- Added "CRITICAL: Bounding Box Accuracy" section
- Emphasized tight, precise boxes
- Better instructions for measuring

### 2. Manual Refinement Tools (TODO)
```typescript
// Add to hotspot-editor.tsx
- Drag to move hotspot
- Resize handles on corners/edges
- Keyboard nudging (arrow keys)
- "Shrink to fit" button
- "Expand" button
```

### 3. Confidence-Based UI (TODO)
```typescript
// Show AI confidence visually
<div className={`
  ${confidence > 0.9 ? 'border-green-400' : 'border-yellow-400'}
  ${confidence < 0.7 ? 'border-dashed' : 'border-solid'}
`}>
  <Badge>{(confidence * 100).toFixed(0)}%</Badge>
</div>
```

### 4. Common Pattern Detection (TODO)
```typescript
// Pre-detect common mobile patterns
const patterns = {
  topBar: detectTopBar(image),      // Header with back/menu
  bottomNav: detectBottomNav(image), // Tab bar
  fab: detectFAB(image),            // Floating action button
};

// Use these as anchors for other detection
```

## Medium-term (Phase 2)

### 1. OCR Integration
Use Tesseract.js or Google Cloud Vision:
```bash
npm install tesseract.js
```

```typescript
// Detect text first, then find clickable areas
const textBlocks = await recognizeText(screenshot);
const buttons = textBlocks.filter(isLikelyButton);
```

### 2. Multi-Model Approach
Combine multiple AI models:
- GPT-4 Vision (general understanding)
- Google Cloud Vision (OCR + object detection)
- Custom YOLO (trained on UI elements)

Vote on results for better accuracy.

### 3. User Feedback Loop
```typescript
// Save user corrections for future training
interface Correction {
  original: BoundingBox;
  corrected: BoundingBox;
  elementType: string;
  timestamp: Date;
}

// Collect 100s of corrections
// Fine-tune GPT-4 or train custom model
```

## Long-term (Phase 3)

### 1. Specialized UI Detection Model
Train or use existing models:
- UIED (UI Element Detection)
- Rico Dataset models
- Custom YOLO trained on UI screenshots

### 2. Design System Recognition
```typescript
// Recognize common design systems
detectDesignSystem(screenshot) 
  // → "Material Design 3"
  // → "iOS Human Interface Guidelines"
  
// Use design system rules for better detection
```

### 3. Screenshot + Figma API
If user has Figma:
```typescript
// Import layer data from Figma
const figmaLayers = await fetchFigmaFile(fileId);
const hotspots = convertLayersToHotspots(figmaLayers);
```

## Benchmarking

Track accuracy over time:
```sql
CREATE TABLE detection_accuracy (
  id UUID PRIMARY KEY,
  screen_id UUID,
  ai_detection JSON,
  user_correction JSON,
  accuracy_score DECIMAL,
  created_at TIMESTAMP
);
```

## Resources

- [UIED GitHub](https://github.com/MulongXie/UIED)
- [Rico Dataset](http://interactionmining.org/rico)
- [Google Cloud Vision API](https://cloud.google.com/vision)
- [Tesseract.js](https://tesseract.projectnaptha.com/)

