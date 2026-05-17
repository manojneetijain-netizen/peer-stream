-- 1. AI Auto-Moderation: Add is_flagged column to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- 2. Rich URL Link Previews: Add link_metadata column to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS link_metadata JSONB;

-- 3. Ephemeral Stories Auto-Cleanup: Set up pg_cron job
-- Enable the pg_cron extension (requires superuser, often enabled by default on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to delete stories older than 24 hours. Runs every hour.
SELECT cron.schedule(
  'cleanup-old-stories',
  '0 * * * *', 
  $$ DELETE FROM public.stories WHERE created_at < NOW() - INTERVAL '24 hours'; $$
);
