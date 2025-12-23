import { supabase } from './supabase';

/**
 * Upload a message image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID (for folder organization)
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadMessageImage(file, userId) {
    if (!supabase) {
        throw new Error('Supabase client is not initialized');
    }

    if (!file) {
        throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
        throw new Error('File size exceeds 5MB limit');
    }

    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('message-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('[messageImageUpload] Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('message-images')
            .getPublicUrl(data.path);

        console.log('[messageImageUpload] Image uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('[messageImageUpload] Failed to upload image:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
}

/**
 * Delete a message image from Supabase Storage
 * @param {string} imageUrl - The public URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteMessageImage(imageUrl) {
    if (!supabase) {
        throw new Error('Supabase client is not initialized');
    }

    if (!imageUrl) {
        return;
    }

    try {
        // Extract file path from URL
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/message-images/');
        if (pathParts.length < 2) {
            throw new Error('Invalid image URL');
        }
        const filePath = pathParts[1];

        // Delete from storage
        const { error } = await supabase.storage
            .from('message-images')
            .remove([filePath]);

        if (error) {
            console.error('[messageImageUpload] Delete error:', error);
            throw error;
        }

        console.log('[messageImageUpload] Image deleted successfully');
    } catch (error) {
        console.error('[messageImageUpload] Failed to delete image:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}
