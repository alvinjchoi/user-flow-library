import { supabase } from "./supabase";

const BUCKET_NAME = "screenshots";

// Initialize storage bucket (run once)
export async function initializeStorage() {
  // Note: Bucket must be created manually in Supabase Dashboard
  // or by running sql/CREATE_STORAGE_BUCKET.sql
  // We don't need to check on every page load since uploads will fail gracefully if not configured
  return true;
}

// Generic file upload function
export async function uploadFile(
  bucketName: string,
  fileName: string,
  file: File
): Promise<string> {
  try {
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Upload screenshot
export async function uploadScreenshot(
  file: File,
  screenId: string
): Promise<string | null> {
  try {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${screenId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading screenshot:", error);
    return null;
  }
}

// Delete screenshot
export async function deleteScreenshot(url: string): Promise<boolean> {
  try {
    // Extract filename from URL
    const fileName = url.split("/").pop();
    if (!fileName) return false;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting screenshot:", error);
    return false;
  }
}

// Get storage bucket info
export async function getStorageInfo() {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);

    if (error) {
      console.error("Error getting bucket info:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting storage info:", error);
    return null;
  }
}
