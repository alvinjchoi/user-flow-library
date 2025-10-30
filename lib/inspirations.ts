import { supabase } from "./supabase";
import type { Screen, ScreenInspiration } from "./database.types";

/**
 * Get all inspiration screens for a given screen
 */
export async function getScreenInspirations(
  screenId: string
): Promise<Screen[]> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase
    .from("screen_inspirations")
    .select(
      `
      related_screen_id,
      screens!screen_inspirations_related_screen_id_fkey (
        id,
        flow_id,
        parent_id,
        title,
        display_name,
        screenshot_url,
        notes,
        order_index,
        level,
        path,
        tags,
        created_at,
        updated_at
      )
    `
    )
    .eq("screen_id", screenId);

  if (error) {
    console.error("Error fetching inspirations:", error);
    throw error;
  }

  // Extract the nested screen objects
  return (data || [])
    .map((item: any) => item.screens)
    .filter((screen: Screen | null) => screen !== null) as Screen[];
}

/**
 * Add an inspiration relationship between two screens
 */
export async function addScreenInspiration(
  screenId: string,
  relatedScreenId: string
): Promise<ScreenInspiration> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from("screen_inspirations")
    .select("*")
    .eq("screen_id", screenId)
    .eq("related_screen_id", relatedScreenId)
    .single();

  if (existing) {
    return existing as ScreenInspiration;
  }

  const { data, error } = await supabase
    .from("screen_inspirations")
    .insert({
      screen_id: screenId,
      related_screen_id: relatedScreenId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding inspiration:", error);
    throw error;
  }

  return data as ScreenInspiration;
}

/**
 * Remove an inspiration relationship
 */
export async function removeScreenInspiration(
  screenId: string,
  relatedScreenId: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { error } = await supabase
    .from("screen_inspirations")
    .delete()
    .eq("screen_id", screenId)
    .eq("related_screen_id", relatedScreenId);

  if (error) {
    console.error("Error removing inspiration:", error);
    throw error;
  }
}

/**
 * Check if a screen has a specific inspiration
 */
export async function hasScreenInspiration(
  screenId: string,
  relatedScreenId: string
): Promise<boolean> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase
    .from("screen_inspirations")
    .select("id")
    .eq("screen_id", screenId)
    .eq("related_screen_id", relatedScreenId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" error
    console.error("Error checking inspiration:", error);
    throw error;
  }

  return !!data;
}

/**
 * Get all screens that reference this screen as inspiration
 */
export async function getScreensInspiredBy(
  screenId: string
): Promise<Screen[]> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase
    .from("screen_inspirations")
    .select(
      `
      screen_id,
      screens!screen_inspirations_screen_id_fkey (
        id,
        flow_id,
        parent_id,
        title,
        display_name,
        screenshot_url,
        notes,
        order_index,
        level,
        path,
        tags,
        created_at,
        updated_at
      )
    `
    )
    .eq("related_screen_id", screenId);

  if (error) {
    console.error("Error fetching screens inspired by:", error);
    throw error;
  }

  // Extract the nested screen objects
  return (data || [])
    .map((item: any) => item.screens)
    .filter((screen: Screen | null) => screen !== null) as Screen[];
}

