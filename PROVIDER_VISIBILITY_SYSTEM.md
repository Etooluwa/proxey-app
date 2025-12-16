# Provider Visibility System

## Overview

This document explains how service providers automatically appear on the client dashboard when they create accounts and complete onboarding.

## System Architecture

### 1. Database Layer

**Providers Table** (`public.providers`)

The system uses a dedicated `providers` table in Supabase to store all provider profiles that should be visible to clients.

**Key Fields:**
- `id` - Unique identifier for the provider
- `user_id` - Links to the auth.users table (the provider's account)
- `name` - Provider's display name
- `category` - Primary service category
- `city` - Location
- `hourly_rate` - Pricing (in cents)
- `rating` - Average rating (default 5.0)
- `services` - Array of services offered
- `availability` - Weekly schedule
- `is_active` - Whether the provider is visible to clients
- `is_profile_complete` - Whether onboarding is finished

**Location:** `/supabase/migrations/20250101000000_create_providers_table.sql`

### 2. Backend API

**GET `/api/providers`** - List all providers

Returns all active provider profiles with optional filtering:
- `?category=cleaning` - Filter by category
- `?minRating=4.5` - Minimum rating
- `?minPrice=5000` - Minimum hourly rate (cents)
- `?maxPrice=15000` - Maximum hourly rate (cents)

**POST `/api/providers/profile`** - Create/Update provider profile

Automatically creates or updates a provider record in the database.

**Request Body:**
```json
{
  "userId": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "category": "home-cleaning",
  "city": "Toronto",
  "services": [
    { "name": "Standard Clean", "price": 12000, "duration": 120 }
  ],
  "availability": { ... },
  "isProfileComplete": true
}
```

**Location:** `/server/server.js:467-560`

### 3. Frontend Integration

#### Provider Onboarding

When a provider completes onboarding ([ProviderOnboardingPage.jsx:29-98](client/src/pages/ProviderOnboardingPage.jsx#L29-L98)):

1. **Update User Metadata** - Saves profile data to auth.users metadata
2. **Sync to Providers Table** - Makes a POST request to `/api/providers/profile`
3. **Provider is Now Visible** - Immediately appears in client searches

#### Provider Profile Updates

When a provider updates their profile ([ProviderProfile.js:61-111](client/src/pages/provider/ProviderProfile.js#L61-L111)):

1. Updates the user metadata
2. Syncs changes to the providers table
3. Changes are immediately visible to clients

#### Client Dashboard Display

The client dashboard ([AppDashboard.js:29-41](client/src/pages/AppDashboard.js#L29-L41)) loads providers:

1. Fetches from `/api/providers` endpoint
2. Displays up to 8 providers in "Popular Professionals" section
3. Shows provider name, photo, rating, and hourly rate
4. Clicking navigates to provider's public profile

## User Flow

### For Providers

1. **Sign Up** → Creates account with role "provider"
2. **Complete Onboarding** → Fills out name, category, city, services, availability
3. **Profile Syncs** → System automatically adds them to `providers` table
4. **Visible to Clients** → Immediately appears in client searches and dashboard

### For Clients

1. **Sign Up** → Creates account with role "client"
2. **View Dashboard** → Sees "Popular Professionals" section
3. **See All Providers** → Can browse all active providers
4. **Filter & Search** → Can find providers by category, price, rating
5. **Book Services** → Click provider → View services → Book appointment

## Setup Instructions

### 1. Run Database Migration

Choose one of these methods:

**Option A: Supabase Dashboard** (Recommended)
1. Go to your Supabase project
2. Click **SQL Editor**
3. Copy contents of `/supabase/migrations/20250101000000_create_providers_table.sql`
4. Paste and click **Run**

**Option B: Supabase CLI**
```bash
npx supabase db push
```

### 2. Verify Setup

Check that the table exists:
```sql
SELECT COUNT(*) FROM providers;
```

### 3. Test the System

**Create a Test Provider:**
1. Sign up with a new account
2. Choose "Provider" role
3. Complete the onboarding flow
4. Check database: `SELECT * FROM providers WHERE user_id = '[your-user-id]';`

**Verify Client Visibility:**
1. Sign in as a client
2. Go to dashboard
3. Scroll to "Popular Professionals" section
4. Your test provider should appear

## Troubleshooting

### Provider not appearing on client dashboard

**Check 1: Is the profile complete?**
```sql
SELECT name, is_profile_complete, is_active
FROM providers
WHERE user_id = '[user-id]';
```

**Check 2: Did the sync fail?**
- Open browser console during onboarding
- Look for `[onboarding] Provider profile synced successfully`
- If you see an error, check the server logs

**Check 3: Is the API endpoint working?**
```bash
curl http://localhost:3001/api/providers
```

Should return JSON with providers array.

**Check 4: RLS Policies**

Make sure Row Level Security policies are set up correctly:
```sql
-- Should return policies for providers table
SELECT * FROM pg_policies WHERE tablename = 'providers';
```

### Provider data not updating

If a provider updates their profile but clients don't see the changes:

1. Check the sync code in `ProviderProfile.js` - should call `/api/providers/profile`
2. Verify the API endpoint received the request (check server logs)
3. Manually update in database to test:
```sql
UPDATE providers
SET bio = 'New bio text'
WHERE user_id = '[user-id]';
```

## Data Flow Diagram

```
Provider Signup
    ↓
Complete Onboarding
    ↓
updateProfile() → auth.users metadata
    ↓
POST /api/providers/profile
    ↓
Supabase INSERT/UPDATE → providers table
    ↓
Client Dashboard
    ↓
GET /api/providers
    ↓
Supabase SELECT * FROM providers WHERE is_active = true
    ↓
Display in "Popular Professionals"
```

## Security Considerations

### Row Level Security (RLS)

The providers table has RLS enabled with these policies:

1. **Anyone can view active providers** - Public read access for client browsing
2. **Providers can update their own profile** - Uses `auth.uid() = user_id`
3. **Providers can insert their own profile** - Uses `auth.uid() = user_id`

### API Endpoint Security

Currently the `/api/providers/profile` endpoint trusts the `userId` from the request body. Consider adding authentication:

```javascript
// Get user ID from JWT token instead of request body
const authHeader = req.headers.authorization;
const token = authHeader?.replace('Bearer ', '');
// Verify token and extract user ID
```

## Future Enhancements

1. **Search & Filtering UI** - Add category filter, price range slider, location search
2. **Provider Verification** - Badge for verified providers
3. **Featured Providers** - Premium placement on dashboard
4. **Provider Analytics** - Track profile views, booking conversion rate
5. **Auto-sync on Profile Changes** - Real-time updates when provider modifies profile
6. **Photo Upload** - Include provider photos in sync to providers table
7. **Reviews & Ratings** - Calculate average rating from bookings

## Related Files

- **Database Schema:** `/supabase/migrations/20250101000000_create_providers_table.sql`
- **Migration README:** `/supabase/migrations/README.md`
- **Backend API:** `/server/server.js` (lines 421-560)
- **Provider Onboarding:** `/client/src/pages/ProviderOnboardingPage.jsx`
- **Provider Profile:** `/client/src/pages/provider/ProviderProfile.js`
- **Client Dashboard:** `/client/src/pages/AppDashboard.js`
