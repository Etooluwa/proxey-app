# Database Migrations

This directory contains SQL migration files for the Proxey application database.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `20250101000000_create_providers_table.sql`
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Docker Desktop and Supabase CLI installed:

```bash
# From the project root
npx supabase db push
```

### Option 3: Manual SQL Execution

Connect to your Supabase PostgreSQL database directly and run:

```bash
psql "postgresql://[YOUR_CONNECTION_STRING]" < supabase/migrations/20250101000000_create_providers_table.sql
```

## Migration Files

### `20250101000000_create_providers_table.sql`

Creates the `providers` table to store service provider profiles that will be visible to clients.

**What it does:**
- Creates a `providers` table with all necessary fields (name, bio, category, services, etc.)
- Sets up indexes for efficient querying
- Enables Row Level Security (RLS)
- Adds policies so that:
  - Anyone can view active provider profiles
  - Providers can only update their own profile
- Creates an auto-update trigger for the `updated_at` timestamp

**After running this migration:**
- When a provider completes onboarding, their profile will automatically appear in the `providers` table
- Clients will see all active providers on their dashboard
- The `/api/providers` endpoint will return real provider data from the database

## Verifying Migration

After running the migration, verify it worked:

```sql
-- Check if the table exists
SELECT * FROM information_schema.tables WHERE table_name = 'providers';

-- Check the table structure
\d providers

-- View any existing providers
SELECT id, name, category, is_active FROM providers;
```

## Troubleshooting

**Error: "relation already exists"**
- The table already exists. You can skip this migration or drop the table first.

**Error: "permission denied"**
- Make sure you're using the service role key or have sufficient permissions.
- In Supabase dashboard, you should have full permissions.

**Providers not appearing on client dashboard:**
1. Make sure the migration ran successfully
2. Check that providers have completed onboarding
3. Verify `is_active = true` in the database
4. Check the browser console for API errors
