-- Create client_profiles table with full lifecycle support
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  account_status text NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended')),
  
  -- Stripe billing (Stripe-only)
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text CHECK (plan IN ('single', 'triple', 'full', 'custom')),
  subscription_status text NOT NULL DEFAULT 'pending_payment' CHECK (subscription_status IN ('pending_payment', 'active', 'past_due', 'canceled')),
  
  -- Contract
  contract_status text NOT NULL DEFAULT 'not_signed' CHECK (contract_status IN ('not_signed', 'signed')),
  contract_signed_at timestamp with time zone,
  
  -- Onboarding  
  onboarding_status text NOT NULL DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed')),
  onboarding_completed_at timestamp with time zone,
  
  -- Services
  max_services integer DEFAULT 1,
  selected_services text[] DEFAULT '{}',
  
  -- Metadata
  first_name text,
  last_name text,
  notes text,
  custom_price numeric,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own client profile"
ON public.client_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own client profile"
ON public.client_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all profiles
CREATE POLICY "Service role manages client profiles"
ON public.client_profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_client_profiles_user_id ON public.client_profiles(user_id);
CREATE INDEX idx_client_profiles_email ON public.client_profiles(email);
CREATE INDEX idx_client_profiles_subscription_status ON public.client_profiles(subscription_status);

-- Update subscriptions table: Remove manual billing columns and constraints
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_migration_status_check;

-- Set all payment_method to 'stripe'
UPDATE public.subscriptions SET payment_method = 'stripe', is_manual = false;

-- Add new subscription_status values constraint
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (subscription_status IN ('pending_payment', 'active', 'past_due', 'canceled', 'manual'));

-- Drop billing reminders table (we're removing manual billing)
DROP TABLE IF EXISTS public.billing_reminders CASCADE;

-- Update function to handle profile timestamps
CREATE OR REPLACE FUNCTION public.update_client_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for client_profiles
DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON public.client_profiles;
CREATE TRIGGER update_client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_client_profile_updated_at();