import supabase from "./supabase";

/**
 * Uploads a profile photo to Supabase Storage
 * @param {File} file - The photo file to upload
 * @param {string} userId - The user's ID for naming the file
 * @returns {Promise<string>} - The public URL of the uploaded photo
 */
export async function uploadProfilePhoto(file, userId) {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  if (!userId) {
    throw new Error("User ID is required for photo upload");
  }

  // If Supabase is not configured, store in localStorage as base64
  if (!supabase) {
    console.warn(
      "[photoUpload] Supabase not configured. Storing photo as base64 in localStorage."
    );
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  try {
    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-photos/${fileName}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[photoUpload] Failed to upload to Supabase Storage", error);
      // Fallback to base64 if upload fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("[photoUpload] Unexpected error during upload", error);
    // Fallback to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Deletes a profile photo from Supabase Storage
 * @param {string} photoUrl - The URL of the photo to delete
 * @returns {Promise<void>}
 */
export async function deleteProfilePhoto(photoUrl) {
  if (!photoUrl || !supabase) {
    return;
  }

  try {
    // Extract file path from URL
    const urlParts = photoUrl.split("/avatars/");
    if (urlParts.length < 2) {
      console.warn("[photoUpload] Invalid photo URL format for deletion");
      return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from("avatars").remove([filePath]);

    if (error) {
      console.error("[photoUpload] Failed to delete photo from storage", error);
    }
  } catch (error) {
    console.error("[photoUpload] Unexpected error during photo deletion", error);
  }
}
