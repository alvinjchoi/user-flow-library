import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase client for server-side queries
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // 🔥 NEW: Query Supabase for complete knowledge base context
    let contextPrompt = "";

    if (projectId) {
      try {
        // Get project details
        const { data: project } = await supabase
          .from("projects")
          .select("name")
          .eq("id", projectId)
          .single();

        // Get all flows in this project
        const { data: flows } = await supabase
          .from("flows")
          .select("id, name, description")
          .eq("project_id", projectId)
          .order("order_index");

        // Get all screens in this project (across all flows)
        const { data: allScreens } = await supabase
          .from("screens")
          .select(
            "id, flow_id, title, display_name, notes, parent_id, order_index"
          )
          .in("flow_id", flows?.map((f) => f.id) || [])
          .order("order_index");

        // Get current flow name if specified
        const currentFlow = flows?.find((f) => f.id === flowId);

        // Build rich context
        if (allScreens && allScreens.length > 0) {
          contextPrompt = `\n\n🔍 KNOWLEDGE BASE - Complete context from "${
            project?.name || "this project"
          }":

📊 PROJECT STRUCTURE:
${flows
  ?.map((f) => {
    const flowScreens = allScreens.filter((s) => s.flow_id === f.id);
    return `• ${f.name} (${flowScreens.length} screens)${
      f.id === flowId ? " ← YOU ARE HERE" : ""
    }`;
  })
  .join("\n")}

📱 EXISTING SCREENS (Technical → Sidebar mapping):
${allScreens
  .map((s) => {
    const flow = flows?.find((f) => f.id === s.flow_id);
    const parentPrefix = s.parent_id ? "  ↳ " : "";
    return `${parentPrefix}[${flow?.name}] "${s.title}" → "${
      s.display_name || s.title
    }"${s.notes ? ` | ${s.notes.substring(0, 50)}...` : ""}`;
  })
  .join("\n")}

📋 CRITICAL GUIDELINES FOR USING THIS KNOWLEDGE BASE:
1. **Match existing patterns**: If this screenshot looks similar to an existing screen, use the EXACT SAME names
2. **Scroll captures**: Multiple screenshots of same screen (e.g., "Home Screen") must have IDENTICAL displayName
3. **Flow context**: You're adding to "${
            currentFlow?.name || "the current flow"
          }" - consider what makes sense in this flow
4. **Naming consistency**: Look at how similar screens are named across ALL flows, not just current flow
5. **Duplicate detection**: Check if a screen with similar title already exists - match its naming pattern
6. **Hierarchical awareness**: Parent screens in other flows may indicate this is a child/continuation

🎯 PATTERN EXAMPLES FROM THIS PROJECT:
${
  allScreens.filter((s) => s.display_name).length > 0
    ? allScreens
        .filter((s) => s.display_name && s.display_name !== s.title)
        .slice(0, 5)
        .map((s) => `- "${s.title}" is called "${s.display_name}" in sidebar`)
        .join("\n")
    : "- No patterns established yet - you're setting the standard!"
}

⚠️ IMPORTANT: Review the ENTIRE knowledge base above before naming. This ensures consistency across the whole project.`;
        } else {
          contextPrompt = `\n\n🔍 KNOWLEDGE BASE: This is the first screen in "${
            project?.name || "this project"
          }". Set a good naming pattern!`;
        }
      } catch (error) {
        console.error("Error fetching knowledge base:", error);
        contextPrompt =
          "\n\n⚠️ Could not load knowledge base. Proceeding with best judgment.";
      }
    }

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
If you detect this is likely a continuation/scroll of an existing screen (check CONTEXT above!):
- title: Keep SAME base name OR add subtle suffix → "Home Screen" or "Home Screen (2)"
- displayName: Use the EXACT SAME displayName as the original → "Browsing community"
- DO NOT create variations like "Browsing community (top)", "Browsing community (bottom)" for scroll captures
- Only differentiate displayName if it's a genuinely DIFFERENT screen state or action

CRITICAL: Review the CONTEXT section above before naming! If a screen with similar title exists, match its naming pattern exactly.${contextPrompt}`,
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
