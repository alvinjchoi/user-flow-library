import { NextRequest, NextResponse } from "next/server";

let OpenAIClient: any = null;
let openai: any = null;

if (process.env.OPENAI_API_KEY) {
  try {
    OpenAIClient = require("openai").default;
    openai = new OpenAIClient({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn("Failed to initialize OpenAI client:", error);
  }
}

type BoundingBox = {
  id: string;
  label: string;
  description?: string;
  confidence?: number;
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

type UiDetectionResponse = {
  components: BoundingBox[];
};

const SYSTEM_PROMPT = `You are a vision assistant that extracts UI components from a mobile or web screenshot.
Return ONLY valid JSON. No prose.

Output format:
{
  "components": [
    {
      "id": "component-1",
      "label": "Primary CTA Button",
      "description": "Call-to-action button at bottom",
      "confidence": 0.86,
      "bounds": {
        "top": 123,
        "left": 45,
        "width": 640,
        "height": 128
      }
    }
  ]
}

Rules:
- Coordinates are pixel values relative to the provided image
- top/left are from the upper-left origin (0,0)
- width/height must be positive numbers
- Include only noteworthy components (buttons, inputs, cards, bottom sheets, modals, nav bars, etc.)
- Use sentences for description but keep them short (≤ 20 words)
- If unsure, omit the component rather than guessing
- confidence is between 0 and 1 (optional)`;

export async function POST(request: NextRequest) {
  if (!openai) {
    return NextResponse.json(
      {
        error: "OpenAI API key not configured",
        details: "Add OPENAI_API_KEY to your environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { imageBase64, imageType = "image/png", maxComponents = 12 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const componentLimit = Math.max(1, Math.min(Number(maxComponents) || 12, 25));

    const userPrompt = `Identify up to ${componentLimit} key UI components in this screenshot. Focus on distinct interactive or informational regions that designers would tag. Follow the JSON schema exactly.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageType};base64,${cleanBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 502 }
      );
    }

    let parsed: UiDetectionResponse | null = null;
    try {
      parsed = JSON.parse(rawContent) as UiDetectionResponse;
    } catch (error) {
      console.error("Failed to parse model response:", rawContent, error);
      return NextResponse.json(
        { error: "Failed to parse model response" },
        { status: 502 }
      );
    }

    if (!parsed?.components) {
      return NextResponse.json(
        { error: "Model returned no components" },
        { status: 200 }
      );
    }

    const normalized = parsed.components
      .filter((component) => {
        const { bounds } = component;
        return (
          bounds &&
          Number.isFinite(bounds.top) &&
          Number.isFinite(bounds.left) &&
          Number.isFinite(bounds.width) &&
          Number.isFinite(bounds.height) &&
          bounds.width > 0 &&
          bounds.height > 0
        );
      })
      .map((component, index) => ({
        id: component.id || `component-${index + 1}`,
        label: component.label || `Component ${index + 1}`,
        description: component.description,
        confidence: component.confidence,
        bounds: {
          top: Math.round(component.bounds.top),
          left: Math.round(component.bounds.left),
          width: Math.round(component.bounds.width),
          height: Math.round(component.bounds.height),
        },
      }));

    return NextResponse.json({ components: normalized });
  } catch (error) {
    console.error("UI detection error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze screenshot",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
