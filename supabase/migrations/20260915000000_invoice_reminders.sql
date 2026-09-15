-- Create invoice_reminders table for tracking invoice due and overdue notifications
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  client_subscription_id UUID REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('upcoming_3_days', 'due_today', 'overdue_15_days')),
  due_date DATE NOT NULL,
  amount NUMERIC(10, 2),
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for Admins and Service Role
CREATE POLICY "Admins manage invoice reminders"
  ON public.invoice_reminders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role manages invoice reminders"
  ON public.invoice_reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast lookup and deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_reminders_unique_send
  ON public.invoice_reminders (client_profile_id, reminder_type, due_date);

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_client_profile_id
  ON public.invoice_reminders (client_profile_id);

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_stripe_subscription_id
  ON public.invoice_reminders (stripe_subscription_id);
