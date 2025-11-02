# Interactive Prototype Feature Plan

## 🎯 Goal
Enable AI-powered interactive hotspots on screenshots to create clickable prototypes, similar to Figma prototype mode.

## 🏗️ Architecture

### 1. Database Schema

```sql
-- New table: screen_hotspots
CREATE TABLE screen_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  
  -- Bounding box (percentage-based for responsive scaling)
  x_position DECIMAL(5,2) NOT NULL CHECK (x_position >= 0 AND x_position <= 100),
  y_position DECIMAL(5,2) NOT NULL CHECK (y_position >= 0 AND y_position <= 100),
  width DECIMAL(5,2) NOT NULL CHECK (width >= 0 AND width <= 100),
  height DECIMAL(5,2) NOT NULL CHECK (height >= 0 AND height <= 100),
  
  -- Element metadata
  element_type TEXT, -- 'button', 'link', 'card', 'tab', 'input', etc.
  element_label TEXT, -- Button text, link text, etc.
  element_description TEXT, -- AI-generated description
  
  -- Navigation link
  target_screen_id UUID REFERENCES screens(id) ON DELETE SET NULL,
  interaction_type TEXT DEFAULT 'navigate', -- 'navigate', 'overlay', 'replace'
  
  -- AI confidence score
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotspots_screen ON screen_hotspots(screen_id);
CREATE INDEX idx_hotspots_target ON screen_hotspots(target_screen_id);
```

### 2. API Endpoints

#### `/api/screens/[id]/detect-elements` (POST)
- Input: screen_id
- Uses GPT-4 Vision to detect clickable elements
- Returns: Array of detected elements with bounding boxes

```typescript
interface DetectedElement {
  type: 'button' | 'link' | 'card' | 'tab' | 'input' | 'icon';
  label: string;
  description: string;
  boundingBox: {
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
  confidence: number; // 0.0 to 1.0
}
```

#### `/api/screens/[id]/hotspots` (GET, POST, PUT, DELETE)
- CRUD operations for hotspots
- GET: Fetch all hotspots for a screen
- POST: Create new hotspot (manual or AI-generated)
- PUT: Update hotspot (change target, adjust position)
- DELETE: Remove hotspot

### 3. Frontend Components

#### `HotspotEditor` Component
```typescript
// Edit mode: Place and configure hotspots
<HotspotEditor
  screen={screen}
  hotspots={hotspots}
  availableScreens={allScreens}
  onAddHotspot={(hotspot) => {}}
  onUpdateHotspot={(id, updates) => {}}
  onDeleteHotspot={(id) => {}}
/>
```

Features:
- Visual overlay on screenshot
- Drag to create bounding box
- Click to select/edit hotspot
- Dropdown to select target screen
- AI "Auto-detect" button

#### `PrototypePlayer` Component
```typescript
// Play mode: Interactive prototype
<PrototypePlayer
  startScreen={screen}
  allScreens={screensByFlow}
  hotspots={hotspotsByScreen}
/>
```

Features:
- Fullscreen mode
- Click hotspots to navigate
- Back button to return
- History stack
- Share link for clients

### 4. UI/UX Flow

#### Edit Mode (Owner)
```
1. Open screen in viewer
2. Click "Add Hotspots" button
3. Choose: "Auto-detect with AI" or "Draw manually"
4. AI detects elements → Show overlay with detected boxes
5. Click each box to assign target screen
6. Save hotspots
```

#### Play Mode (Anyone)
```
1. Click "Play Prototype" button
2. Fullscreen prototype player opens
3. Hover over hotspots → Show highlight
4. Click hotspot → Navigate to target screen
5. Continue clicking through flow
6. ESC to exit
```

## 🤖 AI Implementation

### GPT-4 Vision Prompt
```
You are analyzing a mobile app screenshot to identify all clickable UI elements.
For each interactive element, provide:
1. Element type (button, link, tab, card, icon, input)
2. Element label or text (if visible)
3. Bounding box coordinates as percentages:
   - x: horizontal position from left (0-100%)
   - y: vertical position from top (0-100%)
   - width: element width (0-100%)
   - height: element height (0-100%)
4. Confidence score (0.0-1.0)

Return as JSON array. Focus on primary interactive elements.
Ignore decorative elements, logos, and non-interactive text.
```

### Example Response
```json
[
  {
    "type": "button",
    "label": "Sign In",
    "description": "Primary sign-in button",
    "boundingBox": { "x": 10, "y": 70, "width": 80, "height": 8 },
    "confidence": 0.95
  },
  {
    "type": "link",
    "label": "Forgot Password?",
    "description": "Text link for password recovery",
    "boundingBox": { "x": 30, "y": 82, "width": 40, "height": 4 },
    "confidence": 0.88
  }
]
```

## 🎨 Visual Design

### Hotspot Overlay (Edit Mode)
```
┌─────────────────────────────┐
│  Screenshot                 │
│                             │
│  ┌─────────────────┐        │
│  │  [Sign In]      │ ← Blue translucent box
│  │  → Home Screen  │   + target label
│  └─────────────────┘        │
│                             │
│  ┌──────────┐               │
│  │ Register │               │
│  └──────────┘               │
└─────────────────────────────┘
```

### Hotspot Overlay (Play Mode)
```
- Hidden by default
- Hover: Subtle highlight (blue glow)
- Click: Fade to next screen
- Cursor: pointer on hover
```

## 🚀 Implementation Phases

### Phase 1: Database & API (30 min)
- [ ] Create screen_hotspots table
- [ ] Add RLS policies
- [ ] Create CRUD API routes
- [ ] Add to database.types.ts

### Phase 2: AI Detection (45 min)
- [ ] Create /api/screens/[id]/detect-elements
- [ ] Enhance GPT-4 Vision prompt
- [ ] Parse and validate bounding boxes
- [ ] Return structured JSON

### Phase 3: Hotspot Editor (1.5 hrs)
- [ ] HotspotEditor component
- [ ] Visual bounding box overlay
- [ ] Drag to create hotspot
- [ ] Select target screen dropdown
- [ ] AI auto-detect button
- [ ] Save/update/delete hotspots

### Phase 4: Prototype Player (1 hr)
- [ ] PrototypePlayer component
- [ ] Fullscreen mode
- [ ] Clickable hotspots
- [ ] Navigation stack
- [ ] Exit button

### Phase 5: Integration (30 min)
- [ ] Add "Hotspots" button to screen viewer
- [ ] Add "Play Prototype" button to project page
- [ ] Share link for prototype mode
- [ ] Read-only hotspots for shared links

## 📊 Use Cases

1. **Designer → Developer handoff**
   - Designer creates flow with hotspots
   - Developer sees clickable interactions
   - No ambiguity about navigation

2. **Client presentations**
   - Share prototype link
   - Client clicks through flow
   - No login required (read-only)

3. **User testing**
   - Test flow before development
   - Identify UX issues early
   - Validate navigation patterns

4. **Documentation**
   - Interactive specification
   - Self-documenting flows
   - Always up-to-date

## 💰 Cost Estimation

**OpenAI API:**
- GPT-4 Vision: ~$0.01-0.03 per screenshot
- Detection takes 5-10 seconds
- Optional feature (user triggers manually)

**Storage:**
- Minimal (just bounding box coordinates)
- ~100 bytes per hotspot

## 🎯 Success Metrics

- % of screens with hotspots
- Time spent in prototype mode
- Share link clicks
- User feedback on prototype accuracy

## 🔮 Future Enhancements

- Animation transitions (slide, fade, etc.)
- Gesture support (swipe, scroll)
- Conditional logic (if/else navigation)
- Variables & state management
- Export to Figma/Adobe XD
- Video recording of prototype sessions

---

**Status:** Planning phase
**Priority:** High (unique differentiator)
**Complexity:** Medium-High
**Value:** Very High (killer feature)

