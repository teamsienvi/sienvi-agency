-- Add billing tracking fields to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN billing_cycle text DEFAULT 'monthly',
ADD COLUMN billing_day integer,
ADD COLUMN next_billing_date date,
ADD COLUMN last_billed_date date,
ADD COLUMN billing_reminder_enabled boolean DEFAULT true;

-- Create billing_reminders table for admin notifications
CREATE TABLE public.billing_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  reminder_date date NOT NULL,
  days_until_due integer,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on billing_reminders
ALTER TABLE public.billing_reminders ENABLE ROW LEVEL SECURITY;

-- Only service role can manage billing reminders
CREATE POLICY "Service role can manage billing reminders"
ON public.billing_reminders
FOR ALL
USING (true)
WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);
CREATE INDEX idx_billing_reminders_is_read ON public.billing_reminders(is_read);
CREATE INDEX idx_billing_reminders_subscription_id ON public.billing_reminders(subscription_id);