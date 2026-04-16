-- Normalize bookings.currency default from 'USD' to 'cad'
-- The original create_bookings_table migration set DEFAULT 'USD' (uppercase, wrong case).
-- This migration corrects it to lowercase 'cad' to match the platform convention,
-- and backfills any existing rows that still have the old 'USD' default.

ALTER TABLE public.bookings
    ALTER COLUMN currency SET DEFAULT 'cad';

-- Backfill rows where currency was never explicitly set (still 'USD' from the old default)
UPDATE public.bookings
SET currency = 'cad'
WHERE currency = 'USD';
