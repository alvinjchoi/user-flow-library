# UIED Deployment Options

## Overview

UIED (UI Element Detection) provides precise bounding box detection for interactive UI elements. However, it has **heavy dependencies** (OpenCV, PaddleOCR, etc.) that make deployment challenging.

## ⚠️ **Important: Vercel Function Limitations**

Vercel serverless functions have a **50MB size limit** (uncompressed). UIED's dependencies alone exceed this limit:

- OpenCV: ~40MB
- PaddleOCR models: ~100MB+
- Other dependencies: ~20MB

**Result:** UIED cannot be deployed as a Vercel Python function.

---

## 🎯 **Recommended Approach: Hybrid Detection**

The app uses a **smart fallback system**:

```
1. Try UIED (if configured) → Precise bounding boxes
   ↓ (if fails or unavailable)
2. Fall back to GPT-4 Vision → Semantic understanding
```

---

## 📋 **Deployment Options**

### Option 1: **GPT-4 Vision Only (Default)** ✅

**Best for:** Most use cases, fast deployment

**Pros:**
- ✅ No extra infrastructure needed
- ✅ Already integrated with Vercel
- ✅ Good accuracy for most UIs
- ✅ Zero maintenance

**Cons:**
- ⚠️ Bounding boxes may need manual adjustment
- ⚠️ Costs per API call
- ⚠️ Slower than UIED

**Setup:**
```bash
# Just set OpenAI API key
OPENAI_API_KEY=sk-...
```

---

### Option 2: **UIED + GPT-4 (Hybrid)** 🎯

**Best for:** Production apps needing high accuracy

**Pros:**
- ✅ Most accurate bounding boxes (UIED)
- ✅ Smart fallback to GPT-4
- ✅ Best user experience

**Cons:**
- ⚠️ Requires separate UIED service
- ⚠️ More infrastructure to manage

**Setup:**

#### Step 1: Deploy UIED Service

Choose a platform:

**A. Railway (Recommended)**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy from python-service directory
cd python-service
railway up

# 4. Get the service URL
railway domain
```

**B. Render**
```bash
# 1. Push to GitHub
git push origin feat/uied-integration

# 2. Create new Web Service on Render
# - Connect your GitHub repo
# - Root Directory: python-service
# - Build Command: pip install -r requirements.txt
# - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**C. Fly.io**
```bash
cd python-service
fly launch
fly deploy
```

#### Step 2: Configure Vercel

Add environment variable:
```bash
UIED_SERVICE_URL=https://your-uied-service.railway.app
```

---

### Option 3: **Docker Self-Hosted** 🐳

**Best for:** Full control, on-premise deployment

**Setup:**
```bash
cd python-service

# Build
docker build -t uied-service:latest .

# Run
docker run -d -p 5000:5000 uied-service:latest

# Test
curl http://localhost:5000/health
```

**Deploy to your server:**
```bash
# Production with docker-compose
version: '3.8'
services:
  uied:
    image: uied-service:latest
    ports:
      - "5000:5000"
    restart: unless-stopped
    environment:
      - PORT=5000
```

---

## 🔄 **How the Fallback Works**

### Next.js API Route (`app/api/screens/[id]/detect-elements/route.ts`)

```typescript
// 1. Check if UIED_SERVICE_URL is configured
if (process.env.UIED_SERVICE_URL) {
  try {
    // Try UIED detection
    const response = await fetch(`${process.env.UIED_SERVICE_URL}/detect`, {
      method: 'POST',
      body: JSON.stringify({ imageUrl: screenshot_url })
    });
    
    if (response.ok) {
      // ✅ UIED succeeded
      return { elements, method: 'uied' };
    }
  } catch (error) {
    console.warn('UIED failed, falling back to GPT-4:', error);
  }
}

// 2. Fallback to GPT-4 Vision
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  // ... GPT-4 Vision prompt
});

return { elements, method: 'gpt4' };
```

---

## 💰 **Cost Comparison**

| Method | Cost per Detection | Accuracy | Speed |
|--------|-------------------|----------|-------|
| GPT-4 Vision | ~$0.01-0.05 | Good | 5-10s |
| UIED | $0.00 (compute only) | Excellent | 2-5s |
| Hybrid | $0.00-0.05 | Excellent | 2-10s |

---

## 🎨 **User Experience**

The app shows which detection method was used:

```
🔍 UIED (Precise)          ← UIED succeeded
✨ GPT-4 Vision            ← Using GPT-4 (no UIED configured)
⚠️ GPT-4 (Fallback)       ← UIED failed, fell back to GPT-4
```

---

## 🚀 **Quick Start Guide**

### For Development
```bash
# Use GPT-4 Vision only
echo "OPENAI_API_KEY=sk-..." >> .env.local
npm run dev
```

### For Production
```bash
# Option 1: GPT-4 only
vercel env add OPENAI_API_KEY

# Option 2: With UIED
# 1. Deploy UIED to Railway
cd python-service && railway up

# 2. Add to Vercel
vercel env add UIED_SERVICE_URL
# Value: https://your-railway-app.up.railway.app

# 3. Add OpenAI as fallback
vercel env add OPENAI_API_KEY
```

---

## 🔧 **Troubleshooting**

### UIED always falling back to GPT-4

**Check:**
1. Is `UIED_SERVICE_URL` set?
   ```bash
   vercel env ls
   ```

2. Is UIED service running?
   ```bash
   curl https://your-uied-service/health
   ```

3. Check logs:
   ```bash
   railway logs  # or check Render logs
   ```

### UIED service crashes

**Common issues:**
- Out of memory → Increase RAM (Railway: 512MB minimum)
- Dependencies missing → Check Dockerfile
- Port binding → Ensure PORT env var is used

---

## 📊 **Monitoring**

### UIED Service Health

```bash
# Check health endpoint
curl https://your-uied-service/health

# Expected response:
{
  "status": "healthy",
  "uied_available": true,
  "ocr_available": true
}
```

### Vercel Function Logs

```bash
vercel logs --follow
```

Look for:
- `✅ UIED detected N elements` (success)
- `⚠️ UIED detection failed, falling back` (fallback triggered)
- `🔍 Using GPT-4 Vision` (no UIED configured)

---

## 🎓 **Best Practices**

1. **Start with GPT-4 only** for MVP
2. **Add UIED later** if you need higher accuracy
3. **Monitor costs** and accuracy
4. **Always keep GPT-4 as fallback** (don't disable it)
5. **Cache detection results** to save costs

---

## 📚 **Additional Resources**

- [UIED GitHub Repo](https://github.com/MulongXie/UIED)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GPT-4 Vision API](https://platform.openai.com/docs/guides/vision)

