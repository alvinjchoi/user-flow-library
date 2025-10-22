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

    const { imageUrl, projectId, flowId } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Simple context prompt without Supabase queries to prevent overload
    const contextPrompt = projectId 
      ? `\n\n🔍 CONTEXT: You're analyzing a screenshot for a user flow organizer. Generate both technical and action-oriented names following Mobbin-style conventions.`
      : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing mobile app screenshots and naming user flows. Generate both a technical screen name and an action-oriented display name.

Return your response in this exact JSON format:
{
  "title": "Technical Screen Name",
  "displayName": "Action or Task Name",
  "description": "Brief description of what happens on this screen."
}

CRITICAL: Generate BOTH names with different purposes:
- "title": Technical/consistent name for developers (e.g., "Home Screen", "Search Screen", "Profile Screen")
- "displayName": Action-oriented name for UX flow sidebar (e.g., "Community feed", "Searching posts", "User profile")

NAMING RULES:

📱 For "title" (Technical/Developer Reference):
- Keep it CONSISTENT and SIMPLE
- Use standard UI naming: "Home Screen", "Profile Screen", "Settings Screen"
- If multiple screenshots of SAME screen (e.g., capturing long scroll):
  * Base: "Home Screen"
  * Variants: "Home Screen (Top)", "Home Screen (Middle)", "Home Screen (Bottom)"
  * OR: "Home Screen - Hero", "Home Screen - Feed", "Home Screen - Footer"
- This helps developers identify files and components
- Examples: "Search Screen", "Login Screen", "Chat Screen", "Post Detail Screen"

🎯 For "displayName" (Sidebar/Flow/Action-Oriented):
1. Use action/task-oriented names, NOT "Screen" suffixes
   ✅ GOOD: "Searching Reddit", "Sorting posts", "Blocking a user", "Sending a chat"
   ❌ BAD: "Search Screen", "Sort Screen", "Block Screen", "Chat Screen"

2. Use gerunds (-ing) for active tasks being performed
   ✅ GOOD: "Adding a comment", "Following a user", "Muting notifications"
   ❌ BAD: "Add Comment Screen", "Follow User", "Notification Settings"

3. Use nouns for destinations/views (lowercase for readability)
   ✅ GOOD: "Chat settings", "User profile", "Post detail", "Community feed"
   ❌ BAD: "Settings Screen", "Profile Screen", "Post Screen"

4. Be specific about the context and scroll position if capturing long screens
   ✅ GOOD: "Home feed (top)", "Home feed (posts)", "Home feed (recommendations)"
   ❌ BAD: "Home", "Home 2", "Home 3"

5. Keep it concise but descriptive (2-5 words)

6. Match the naming style of existing screens when possible

7. Focus on WHAT the user is doing or seeing, not just WHERE they are

HANDLING DUPLICATES & CONTEXT AWARENESS:
If you detect this is likely a continuation/scroll of an existing screen:
- title: Keep SAME base name OR add subtle suffix → "Home Screen" or "Home Screen (2)"
- displayName: Use the EXACT SAME displayName as the original → "Browsing community"
- DO NOT create variations like "Browsing community (top)", "Browsing community (bottom)" for scroll captures
- Only differentiate displayName if it's a genuinely DIFFERENT screen state or action${contextPrompt}`,
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
      displayName: parsed.displayName || parsed.title || "Untitled Screen",
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