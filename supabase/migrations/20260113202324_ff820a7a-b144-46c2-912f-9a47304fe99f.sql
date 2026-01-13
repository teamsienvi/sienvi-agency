-- Add columns to subscriptions table for onboarding
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS selected_services text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);