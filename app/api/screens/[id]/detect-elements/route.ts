import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type for detected element from AI
interface DetectedElement {
  type: 'button' | 'link' | 'card' | 'tab' | 'input' | 'icon' | 'other';
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

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API is not configured" },
        { status: 503 }
      );
    }

    const { id: screenId } = await context.params;

    // Get the screen and its screenshot URL
    const { data: screen, error: screenError } = await supabase
      .from("screens")
      .select("id, title, screenshot_url")
      .eq("id", screenId)
      .single();

    if (screenError || !screen) {
      return NextResponse.json(
        { error: "Screen not found" },
        { status: 404 }
      );
    }

    if (!screen.screenshot_url) {
      return NextResponse.json(
        { error: "Screen has no screenshot" },
        { status: 400 }
      );
    }

    // Call GPT-4 Vision to detect clickable elements
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
                url: screen.screenshot_url,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let detectedElements: DetectedElement[];
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      detectedElements = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw content:", content);
      return NextResponse.json(
        { error: "Failed to parse AI response", details: content },
        { status: 500 }
      );
    }

    // Validate and normalize the detected elements
    const validElements = detectedElements
      .filter((element) => {
        // Validate bounding box
        const { x, y, width, height } = element.boundingBox;
        return (
          x >= 0 && x <= 100 &&
          y >= 0 && y <= 100 &&
          width > 0 && width <= 100 &&
          height > 0 && height <= 100 &&
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
      usage: response.usage,
    });
  } catch (error: any) {
    console.error("Unexpected error in POST /api/screens/[id]/detect-elements:", error);
    
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

