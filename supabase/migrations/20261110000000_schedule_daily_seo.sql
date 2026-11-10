-- Ensure agency_blog_posts table exists and schedule daily SEO insight generation for Sienvi Agency (sienvi.com)
-- Runs daily at 05:00 UTC (1:00 PM PHT)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.agency_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Growth Strategy',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agency_blog_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agency_blog_posts' AND policyname = 'Public read published agency_blog_posts'
  ) THEN
    CREATE POLICY "Public read published agency_blog_posts"
      ON public.agency_blog_posts FOR SELECT
      USING (status = 'published');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sienvi-daily-seo') THEN
    PERFORM cron.unschedule('sienvi-daily-seo');
  END IF;
END $$;

SELECT cron.schedule(
  'sienvi-daily-seo',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jdodjbzypuiyhgrzuyzp.supabase.co/functions/v1/auto-blog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-trigger', 'true'
    ),
    body := '{"source": "pg_cron_daily"}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);

