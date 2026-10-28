-- One-time charges (e.g. Amazon Design Package) billed via Stripe invoices.
-- Kept separate from client_subscriptions so recurring-billing logic
-- (invoice reminders, MRR, update-client sync) never touches them.
CREATE TABLE IF NOT EXISTS public.client_one_time_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  service_id text,
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'open', -- open | paid | void | uncollectible
  stripe_invoice_id text UNIQUE,
  stripe_customer_id text,
  hosted_invoice_url text,
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_one_time_payments_client
  ON public.client_one_time_payments (client_profile_id);

ALTER TABLE public.client_one_time_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage one-time payments" ON public.client_one_time_payments;
CREATE POLICY "Admins manage one-time payments" ON public.client_one_time_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Clients view own one-time payments" ON public.client_one_time_payments;
CREATE POLICY "Clients view own one-time payments" ON public.client_one_time_payments
  FOR SELECT USING (
    client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())
  );
