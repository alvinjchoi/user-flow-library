import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not found in environment variables");
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          details:
            "Please add OPENAI_API_KEY to your .env.local file and restart the dev server",
        },
        { status: 500 }
      );
    }

    const { imageUrl, context } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Build context prompt from existing screens
    const contextPrompt =
      context && context.length > 0
        ? `\n\nFor context, here are other screens in this app:\n${context
            .map(
              (s: any) =>
                `- ${s.title}${s.description ? `: ${s.description}` : ""}`
            )
            .join("\n")}`
        : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing mobile app screenshots and naming user flows. Generate an action-oriented title (2-5 words) and a brief description (1-2 sentences).

Return your response in this exact JSON format:
{
  "title": "Action or Task Name",
  "description": "Brief description of what happens on this screen."
}

NAMING RULES (follow strictly):
1. Use action/task-oriented names, NOT "Screen" suffixes
   ✅ GOOD: "Searching Reddit", "Sorting posts", "Blocking a user", "Sending a chat"
   ❌ BAD: "Search Screen", "Sort Screen", "Block Screen", "Chat Screen"

2. Use gerunds (-ing) for active tasks being performed
   ✅ GOOD: "Adding a comment", "Following a user", "Muting notifications"
   ❌ BAD: "Add Comment Screen", "Follow User", "Notification Settings"

3. Use nouns for destinations/views
   ✅ GOOD: "Chat settings", "User profile", "Post detail"
   ❌ BAD: "Settings Screen", "Profile Screen", "Post Screen"

4. Be specific about the context
   ✅ GOOD: "Searching comments", "Replying to a comment", "Pausing chat notifications"
   ❌ BAD: "Search", "Reply", "Pause"

5. Keep it concise but descriptive (2-5 words)

6. Match the naming style of existing screens when possible

7. Focus on WHAT the user is doing, not just WHERE they are${contextPrompt}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this mobile app screenshot and provide a title and description:",
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
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    console.log("Raw OpenAI response:", response);

    // Parse the JSON response - remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }

    console.log("Cleaned response:", cleanedResponse);

    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed to parse:", cleanedResponse);
      // Return a fallback response instead of throwing
      return NextResponse.json({
        title: "New Screen",
        description: "Screenshot uploaded successfully",
      });
    }

    return NextResponse.json({
      title: parsed.title || "Untitled Screen",
      description: parsed.description || "No description available",
    });
  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze screenshot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
