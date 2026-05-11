-- =====================================================================
-- Email Reminders System — Table + RLS
-- Tracks which reminder emails have been sent per client (Day 2/4/7)
-- =====================================================================

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  reminder_day integer NOT NULL CHECK (reminder_day IN (2, 4, 7)),
  email_type text NOT NULL CHECK (email_type IN ('contract', 'onboarding')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_profile_id, reminder_day)
);

COMMENT ON TABLE public.email_reminders IS
  'Tracks automated reminder emails sent to clients at Day 2, 4, and 7 after account creation.';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

-- Admins can read and manage all reminders
CREATE POLICY "Admins manage all email reminders" ON public.email_reminders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) can do everything
CREATE POLICY "Service role manages email reminders" ON public.email_reminders
  FOR ALL USING (true) WITH CHECK (true);
