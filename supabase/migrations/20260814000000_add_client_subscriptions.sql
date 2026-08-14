-- =====================================================================
-- Multi-Subscription Support: client_subscriptions table
-- Allows a single client_profile to have multiple subscriptions
-- with different plans, services, billing days, and Stripe IDs.
-- =====================================================================

-- ---------- Table ----------
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  label text NOT NULL,                        -- display name, e.g. "PPC + Social Automation Package"
  plan text,                                  -- 'single','triple','full','custom','advertising', etc.
  selected_services text[] DEFAULT '{}',
  monthly_amount numeric NOT NULL DEFAULT 0,
  billing_day integer CHECK (billing_day >= 1 AND billing_day <= 31),
  next_billing_date date,
  subscription_status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text,
  stripe_customer_id text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Index ----------
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_profile
  ON public.client_subscriptions(client_profile_id);

-- ---------- RLS ----------
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

-- Clients can view their own subscriptions
CREATE POLICY "Users view own subscriptions" ON public.client_subscriptions
  FOR SELECT USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all (used by edge functions)
CREATE POLICY "Service role manages client subscriptions" ON public.client_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- ---------- updated_at trigger ----------
CREATE TRIGGER trg_client_subscriptions_updated_at
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Seed data for client 79099b9d-0281-4a95-8076-dcff0fd128a4 ----------
INSERT INTO public.client_subscriptions (client_profile_id, label, plan, selected_services, monthly_amount, billing_day, next_billing_date, subscription_status, is_primary)
VALUES
  (
    '79099b9d-0281-4a95-8076-dcff0fd128a4',
    'PPC + Social Automation Package',
    'custom',
    '{"social-media-suite"}',
    2395.00,
    15,
    '2026-09-15',
    'active',
    true
  ),
  (
    '79099b9d-0281-4a95-8076-dcff0fd128a4',
    'Website Maintenance + Advertising',
    'custom',
    '{"custom-website", "advertising-package"}',
    1605.00,
    28,
    '2026-09-28',
    'active',
    false
  );
