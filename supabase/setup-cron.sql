-- =====================================================================
-- pg_cron Scheduler for Daily Reminder Emails
-- 
-- PREREQUISITES (run in Supabase Dashboard > Database > Extensions):
--   1. Enable "pg_cron"
--   2. Enable "pg_net"
--
-- THEN run this SQL in the Supabase SQL Editor.
-- Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
-- (found at: Project Settings > API > service_role key)
-- =====================================================================

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Store the service role key as a DB setting (used by cron job)
-- IMPORTANT: Replace the placeholder below with your actual service_role key
ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';

-- Schedule the daily reminder job at 9:00 AM UTC
SELECT cron.schedule(
  'sienvi-daily-reminders',        -- job name (must be unique)
  '0 9 * * *',                     -- cron expression: every day at 09:00 UTC
  $$
    SELECT net.http_post(
      url     := 'https://jdodjbzypuiyhgrzuyzp.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- Verify the job was created
SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'sienvi-daily-reminders';
