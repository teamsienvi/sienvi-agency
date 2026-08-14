-- Add contract fields to client_subscriptions so each subscription can have its own contract
ALTER TABLE public.client_subscriptions
  ADD COLUMN IF NOT EXISTS contract_status text NOT NULL DEFAULT 'not_signed',
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_signature text,
  ADD COLUMN IF NOT EXISTS contract_details jsonb;

COMMENT ON COLUMN public.client_subscriptions.contract_status IS
  'Per-subscription contract status: not_signed, signed';
COMMENT ON COLUMN public.client_subscriptions.contract_details IS
  'Stores uploadedContractUrl, uploadedContractName, initialTerm, noticePeriod, billingTerms, serviceDelivery';
