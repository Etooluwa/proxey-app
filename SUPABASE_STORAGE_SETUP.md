# Supabase Storage Setup for Profile Photos

This guide explains how to set up Supabase Storage to enable profile photo uploads in the Kliques app.

## Prerequisites

- Supabase project created
- `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` configured in `.env`

## Setup Steps

### 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Enable (so users can view profile photos)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

5. Click **Create bucket**

### 2. Set Up Storage Policies

To allow users to upload and view their own profile photos, you need to set up Row Level Security (RLS) policies:

1. In the Storage section, click on the **avatars** bucket
2. Go to **Policies** tab
3. Create the following policies:

#### Policy 1: Allow Public Read Access
```sql
-- This allows anyone to view profile photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );
```

#### Policy 2: Allow Authenticated Users to Upload
```sql
-- This allows authenticated users to upload their own photos
CREATE POLICY "Authenticated users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-photos'
);
```

#### Policy 3: Allow Users to Update Their Own Photos
```sql
-- This allows users to update their own photos
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-photos'
);
```

#### Policy 4: Allow Users to Delete Their Own Photos
```sql
-- This allows users to delete their own photos
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-photos'
);
```

### 3. Verify Setup

To verify the bucket is working correctly:

1. Try uploading a test file through the Supabase dashboard
2. Check that the file appears in the bucket
3. Copy the public URL and verify it's accessible in a browser

## How It Works in the App

### Upload Flow

1. User selects a photo during onboarding
2. Photo is stored locally in component state with a preview URL
3. When user completes onboarding, the photo file is passed to `updateProfile()`
4. `updateProfile()` calls `uploadProfilePhoto()` which:
   - Generates a unique filename: `{userId}-{timestamp}.{ext}`
   - Uploads to path: `profile-photos/{filename}`
   - Returns the public URL
5. The photo URL is saved to the user's profile in Supabase user_metadata

### Fallback Behavior

If Supabase is not configured or upload fails:
- Photos are converted to base64 strings
- Stored in localStorage
- This allows the app to work without Supabase for development/testing

## File Structure

- **Upload utility**: `/client/src/utils/photoUpload.js`
- **Auth context**: `/client/src/auth/authContext.jsx`
- **Onboarding page**: `/client/src/pages/OnboardingPage.jsx`

## Testing

1. Start the app and go through the onboarding flow
2. Upload a profile photo in Step 1
3. Complete all steps
4. Check browser console for upload success message
5. Verify photo URL is saved in profile:
   - Open browser DevTools
   - Go to Application > Local Storage
   - Find the profile data and verify `photo` field contains a URL

## Troubleshooting

### Upload fails with "Policy violation"
- Check that RLS policies are correctly configured
- Verify the user is authenticated before uploading

### Photos not displaying
- Check that the bucket is set to **Public**
- Verify the public URL is correct
- Check browser console for CORS errors

### Upload fails silently
- App will fall back to base64 encoding
- Check browser console for error messages
- Verify Supabase environment variables are set correctly

## Next Steps

- Add photo cropping/resizing before upload
- Implement photo deletion when user changes their photo
- Add image optimization (compress before upload)
- Display profile photo in AccountPage
