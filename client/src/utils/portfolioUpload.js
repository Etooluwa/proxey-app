import supabase from "./supabase";

/**
 * Uploads a portfolio image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The provider's user ID
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadPortfolioImage(file, userId) {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  if (!userId) {
    throw new Error("User ID is required for portfolio upload");
  }

  if (!supabase) {
    // Fallback to base64 if Supabase not configured
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[portfolioUpload] Failed to upload to Supabase Storage", error);
      // Fallback to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("[portfolioUpload] Unexpected error during upload", error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Deletes a portfolio image from Supabase Storage
 * @param {string} imageUrl - The URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deletePortfolioImage(imageUrl) {
  if (!imageUrl || !supabase) return;

  try {
    const urlParts = imageUrl.split("/portfolio-images/");
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];
    const { error } = await supabase.storage.from("portfolio-images").remove([filePath]);

    if (error) {
      console.error("[portfolioUpload] Failed to delete image from storage", error);
    }
  } catch (error) {
    console.error("[portfolioUpload] Unexpected error during deletion", error);
  }
}
