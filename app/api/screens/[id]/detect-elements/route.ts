import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// UIED/ScreenCoder service configuration
const UIED_SERVICE_URL = process.env.UIED_SERVICE_URL; // e.g., http://localhost:5000 or https://user-flow-library.onrender.com
const USE_UIED = Boolean(UIED_SERVICE_URL);

// Type for detected element from AI
interface DetectedElement {
  type: "button" | "link" | "card" | "tab" | "input" | "icon" | "other";
  label: string;
  description: string;
  boundingBox: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number; // percentage 0-100
    height: number; // percentage 0-100
  };
  confidence: number; // 0.0 to 1.0
}

// Helper: Detect elements using ScreenCoder layout generation
async function detectWithScreenCoder(
  imageUrl: string
): Promise<DetectedElement[]> {
  try {
    // ScreenCoder calls GPT-4 multiple times (block parsing + HTML generation per block)
    // Set a generous timeout: 3 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds

    const response = await fetch(`${UIED_SERVICE_URL}/generate-layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ScreenCoder service error: ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    // Debug: Log the full ScreenCoder response
    console.log("=== ScreenCoder Response ===");
    console.log("Full response:", JSON.stringify(data, null, 2));
    console.log("data.blocks:", data.blocks);
    console.log("data.metadata:", data.metadata);
    console.log("Response keys:", Object.keys(data));
    console.log("===========================");

    // Convert layout blocks to DetectedElements
    const elements: DetectedElement[] = [];
    const metadata = data.metadata || {};
    const imageWidth = metadata.imageWidth || 1290; // fallback dimensions
    const imageHeight = metadata.imageHeight || 2796;

    // Parse bboxes from the response (ScreenCoder stores coordinates in 'bboxes', not 'blocks')
    const bboxes = data.bboxes || {};

    console.log("Found bboxes:", Object.keys(bboxes).length);

    for (const [blockName, bbox] of Object.entries(bboxes)) {
      const bboxArray = bbox as number[];
      if (!bboxArray || bboxArray.length !== 4) {
        console.warn(`Invalid bbox for ${blockName}:`, bboxArray);
        continue;
      }

      const [x1, y1, x2, y2] = bboxArray;

      // Convert pixel coordinates to percentages
      const x = (x1 / imageWidth) * 100;
      const y = (y1 / imageHeight) * 100;
      const width = ((x2 - x1) / imageWidth) * 100;
      const height = ((y2 - y1) / imageHeight) * 100;

      // Map block name to element type
      let type: DetectedElement["type"] = "other";
      const lowerName = blockName.toLowerCase();
      if (lowerName.includes("button")) type = "button";
      else if (lowerName.includes("nav") || lowerName.includes("menu"))
        type = "link";
      else if (lowerName.includes("card")) type = "card";
      else if (lowerName.includes("tab")) type = "tab";
      else if (lowerName.includes("input") || lowerName.includes("search"))
        type = "input";
      else if (lowerName.includes("icon")) type = "icon";
      else if (lowerName.includes("header") || lowerName.includes("footer"))
        type = "other";

      elements.push({
        type,
        label: blockName,
        description: `${blockName} region detected by ScreenCoder`,
        boundingBox: { x, y, width, height },
        confidence: 0.85, // ScreenCoder uses GPT-4 Vision, high confidence
      });

      console.log(
        `Created element: ${blockName} at (${x.toFixed(1)}%, ${y.toFixed(1)}%)`
      );
    }

    console.log(`ScreenCoder: Converted ${elements.length} bboxes to elements`);

    return elements;
  } catch (error) {
    console.error("ScreenCoder detection failed:", error);
    throw error;
  }
}

// Helper: Detect elements using UIED service
async function detectWithUIED(imageUrl: string): Promise<DetectedElement[]> {
  try {
    // UIED can be slow (especially first run with model downloads)
    // Set a generous timeout: 2 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds

    const response = await fetch(`${UIED_SERVICE_URL}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, includeLabels: true }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`UIED service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error("UIED detection failed:", error);
    throw error;
  }
}

// Helper: Detect elements using GPT-4 Vision
async function detectWithGPT4(imageUrl: string): Promise<DetectedElement[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are analyzing a mobile app screenshot to identify all clickable UI elements for creating an interactive prototype.

**CRITICAL: Bounding Box Accuracy**
- Provide TIGHT, PRECISE bounding boxes that wrap EXACTLY around the interactive element
- DO NOT include extra padding or whitespace
- The box should only cover the actual clickable area (button, icon, or text)
- For text buttons: include only the text and immediate button background, not surrounding space
- For icons: wrap tightly around the icon shape
- Measure carefully using the actual pixel dimensions

For each interactive element, provide:
1. Element type: Choose from 'button', 'link', 'tab', 'card', 'icon', 'input', or 'other'
2. Element label: The exact text visible on the element (case-sensitive)
3. Element description: A brief description of what the element does
4. Bounding box coordinates as percentages (0-100):
   - x: horizontal position from left edge to the LEFT edge of the element (not its center)
   - y: vertical position from top edge to the TOP edge of the element (not its center)
   - width: EXACT width of the clickable element (not including padding)
   - height: EXACT height of the clickable element (not including padding)
5. Confidence score (0.0-1.0): How confident you are that this is an interactive element

Focus on:
- Primary action buttons (e.g., "Sign In", "Continue", "Submit")
- Navigation elements (tabs, back buttons, menu items)
- Interactive cards or list items
- Form inputs and selectors
- Links and call-to-action elements

Ignore:
- Decorative elements (logos, background images, illustrations)
- Static text (headings, paragraphs, labels that are not clickable)
- Non-interactive UI chrome (status bar, safe areas)

Return ONLY a valid JSON array with no additional text. Example format:
[
  {
    "type": "button",
    "label": "Sign In",
    "description": "Primary sign-in button",
    "boundingBox": { "x": 12, "y": 72, "width": 76, "height": 6 },
    "confidence": 0.95
  }
]`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from GPT-4 Vision");
  }

  // Parse the JSON response
  const cleanedContent = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleanedContent);
}

// POST /api/screens/[id]/detect-elements - Use AI to detect clickable elements
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: screenId } = await context.params;

    // Get the screen and its screenshot URL
    const { data: screen, error: screenError } = await supabase
      .from("screens")
      .select("id, title, screenshot_url")
      .eq("id", screenId)
      .single();

    if (screenError || !screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    if (!screen.screenshot_url) {
      return NextResponse.json(
        { error: "Screen has no screenshot" },
        { status: 400 }
      );
    }

    let detectedElements: DetectedElement[];
    let detectionMethod: "screencoder" | "uied" | "gpt4" | "fallback" = "gpt4";
    let detectionError: string | null = null;

    // Try ScreenCoder first if configured (best for layout detection)
    if (USE_UIED) {
      try {
        console.log("🎨 Attempting ScreenCoder layout detection...");
        detectedElements = await detectWithScreenCoder(screen.screenshot_url);
        detectionMethod = "screencoder";
        console.log(
          `✅ ScreenCoder detected ${detectedElements.length} layout blocks`
        );
      } catch (screencoderError: any) {
        console.warn(
          "⚠️ ScreenCoder failed, trying UIED component detection:",
          screencoderError.message
        );
        detectionError = screencoderError.message;

        // Fallback to UIED component detection
        try {
          console.log("🔍 Attempting UIED component detection...");
          detectedElements = await detectWithUIED(screen.screenshot_url);
          detectionMethod = "uied";
          console.log(`✅ UIED detected ${detectedElements.length} components`);
        } catch (uiedError: any) {
          console.warn(
            "⚠️ UIED also failed, falling back to GPT-4:",
            uiedError.message
          );
          detectionError = `ScreenCoder: ${screencoderError.message}; UIED: ${uiedError.message}`;
          detectionMethod = "fallback";

          // Final fallback to GPT-4
          if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
              {
                error:
                  "All detection methods failed and OpenAI API is not configured",
                details: detectionError,
              },
              { status: 503 }
            );
          }

          detectedElements = await detectWithGPT4(screen.screenshot_url);
          console.log(
            `✅ GPT-4 fallback detected ${detectedElements.length} elements`
          );
        }
      }
    } else {
      // Use GPT-4 Vision as primary method (when UIED service not configured)
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OpenAI API is not configured" },
          { status: 503 }
        );
      }

      console.log("🔍 Using GPT-4 Vision detection...");
      detectedElements = await detectWithGPT4(screen.screenshot_url);
      console.log(`✅ GPT-4 detected ${detectedElements.length} elements`);
    }

    // Validate and normalize the detected elements
    const validElements = detectedElements
      .filter((element) => {
        // Validate bounding box
        const { x, y, width, height } = element.boundingBox;
        return (
          x >= 0 &&
          x <= 100 &&
          y >= 0 &&
          y <= 100 &&
          width > 0 &&
          width <= 100 &&
          height > 0 &&
          height <= 100 &&
          x + width <= 100 &&
          y + height <= 100
        );
      })
      .map((element, index) => ({
        ...element,
        order_index: index,
      }));

    return NextResponse.json({
      elements: validElements,
      count: validElements.length,
      raw_count: detectedElements.length,
      method: detectionMethod,
      ...(detectionError && { warning: detectionError }),
    });
  } catch (error: any) {
    console.error(
      "Unexpected error in POST /api/screens/[id]/detect-elements:",
      error
    );

    // Handle OpenAI specific errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key is invalid" },
        { status: 503 }
      );
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "OpenAI API rate limit exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
