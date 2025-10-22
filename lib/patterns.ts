import { supabase } from "./supabase";
import type { Pattern } from "./supabase";
import patternsData from "@/data/patterns.json";

// Transform database row to Pattern type
function transformPattern(row: any): Pattern {
  return {
    id: row.id,
    title: row.title,
    tags: row.tags || [],
    category: row.category,
    screenshots: row.screenshots || [],
    description: row.description,
    createdAt: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Track if we've already checked/migrated to avoid repeated checks
let migrationChecked = false;

// Check if patterns table exists and has data
async function checkAndMigrateData() {
  // Only run once per session
  if (migrationChecked) return;
  migrationChecked = true;

  // Skip if Supabase is not available
  if (!supabase) {
    console.log("📋 Supabase not available, using mock data");
    return;
  }

  try {
    const { count, error } = await supabase
      .from("patterns")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.warn(
        "⚠️ Cannot connect to Supabase patterns table:",
        error.message
      );
      console.log("💡 SETUP REQUIRED: Create the patterns table in Supabase");
      console.log("📖 Instructions: See CREATE_TABLE.sql or QUICKSTART.md");
      return;
    }

    // If table is empty, migrate mock data
    if (count === 0) {
      console.log("🔄 Migrating mock data to Supabase...");
      const { error: insertError } = await supabase.from("patterns").insert(
        patternsData.map((p) => ({
          id: p.id,
          title: p.title,
          tags: p.tags,
          category: p.category,
          screenshots: p.screenshots,
          description: p.description,
          created_at: p.createdAt,
        }))
      );
      if (insertError) {
        console.error("❌ Migration error:", insertError.message);
      } else {
        console.log(
          "✅ Migration complete! " +
            patternsData.length +
            " patterns added to Supabase"
        );
      }
    } else {
      console.log("✅ Supabase connected! Found " + count + " patterns");
    }
  } catch (error) {
    console.warn(
      "⚠️ Supabase connection error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// Get all patterns with optional filtering
export async function getPatterns(params?: {
  search?: string;
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}): Promise<{ patterns: Pattern[]; total: number }> {
  try {
    // Try to migrate data on first load
    await checkAndMigrateData();

    // Skip Supabase if not available
    if (!supabase) {
      throw new Error("Supabase not available");
    }

    let query = supabase.from("patterns").select("*", { count: "exact" });

    // Apply category filter
    if (params?.category && params.category !== "all") {
      query = query.eq("category", params.category);
    }

    // Apply tag filters (contains all specified tags)
    if (params?.tags && params.tags.length > 0) {
      params.tags.forEach((tag) => {
        query = query.contains("tags", [tag]);
      });
    }

    // Apply search filter (search in title, description, and tags)
    if (params?.search) {
      query = query.or(
        `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
      );
    }

    // Apply pagination
    if (params?.limit) {
      query = query.range(
        params.offset || 0,
        (params.offset || 0) + params.limit - 1
      );
    }

    // Order by created_at descending
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching patterns:", error);
      throw error;
    }

    return {
      patterns: (data || []).map(transformPattern),
      total: count || 0,
    };
  } catch (error) {
    console.warn(
      "⚠️ Supabase error in getPatterns:",
      error instanceof Error ? error.message : "Unknown error"
    );
    // Fallback to mock data if Supabase fails
    console.log("📋 Using fallback patterns from mock data");
    let filtered = patternsData;

    if (params?.category && params.category !== "all") {
      filtered = filtered.filter((p) => p.category === params.category);
    }

    if (params?.tags && params.tags.length > 0) {
      filtered = filtered.filter((p) =>
        params.tags!.every((tag) => p.tags.includes(tag))
      );
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((p) =>
        `${p.title} ${p.description} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(search)
      );
    }

    const start = params?.offset || 0;
    const end = start + (params?.limit || filtered.length);

    return {
      patterns: filtered.slice(start, end).map((p) => ({
        ...p,
        createdAt: p.createdAt,
      })),
      total: filtered.length,
    };
  }
}

// Get a single pattern by ID
export async function getPatternById(id: string): Promise<Pattern | null> {
  try {
    // Skip Supabase if not available
    if (!supabase) {
      throw new Error("Supabase not available");
    }

    const { data, error } = await supabase
      .from("patterns")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching pattern:", error);
      throw error;
    }

    return data ? transformPattern(data) : null;
  } catch (error) {
    console.warn(
      "⚠️ Supabase error in getPatternById:",
      error instanceof Error ? error.message : "Unknown error"
    );
    // Fallback to mock data
    console.log("📋 Using fallback pattern from mock data");
    const pattern = patternsData.find((p) => p.id === id);
    return pattern
      ? {
          ...pattern,
          createdAt: pattern.createdAt,
        }
      : null;
  }
}

// Get all unique categories
export async function getCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("patterns")
      .select("category")
      .order("category");

    if (error) {
      console.warn(
        "⚠️ Supabase error fetching categories (using fallback):",
        error.message
      );
      throw error;
    }

    const uniqueCategories = Array.from(
      new Set((data || []).map((row) => row.category))
    );
    return uniqueCategories;
  } catch (error) {
    console.log("📋 Using fallback categories from mock data");
    // Fallback to mock data
    return Array.from(new Set(patternsData.map((p) => p.category)));
  }
}

// Get all unique tags
export async function getTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("patterns").select("tags");

    if (error) {
      console.warn(
        "⚠️ Supabase error fetching tags (using fallback):",
        error.message
      );
      throw error;
    }

    const allTags = (data || []).flatMap((row) => row.tags || []);
    const uniqueTags = Array.from(new Set(allTags)).sort();
    return uniqueTags;
  } catch (error) {
    console.log("📋 Using fallback tags from mock data");
    // Fallback to mock data
    return Array.from(new Set(patternsData.flatMap((p) => p.tags))).sort();
  }
}

// Create a new pattern
export async function createPattern(
  pattern: Omit<Pattern, "createdAt" | "created_at" | "updated_at">
): Promise<Pattern> {
  const { data, error } = await supabase
    .from("patterns")
    .insert({
      id: pattern.id,
      title: pattern.title,
      tags: pattern.tags,
      category: pattern.category,
      screenshots: pattern.screenshots,
      description: pattern.description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating pattern:", error);
    throw error;
  }

  return transformPattern(data);
}

// Update an existing pattern
export async function updatePattern(
  id: string,
  updates: Partial<
    Omit<Pattern, "id" | "createdAt" | "created_at" | "updated_at">
  >
): Promise<Pattern> {
  const { data, error } = await supabase
    .from("patterns")
    .update({
      ...(updates.title && { title: updates.title }),
      ...(updates.tags && { tags: updates.tags }),
      ...(updates.category && { category: updates.category }),
      ...(updates.screenshots && { screenshots: updates.screenshots }),
      ...(updates.description && { description: updates.description }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating pattern:", error);
    throw error;
  }

  return transformPattern(data);
}

// Delete a pattern
export async function deletePattern(id: string): Promise<void> {
  const { error } = await supabase.from("patterns").delete().eq("id", id);

  if (error) {
    console.error("Error deleting pattern:", error);
    throw error;
  }
}
