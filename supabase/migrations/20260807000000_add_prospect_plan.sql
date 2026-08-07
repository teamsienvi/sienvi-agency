-- Add 'prospect' as a valid plan type for client_profiles
-- and add discovery_form_type for future questionnaire variant routing

-- Step 1: Drop the existing plan check constraint
ALTER TABLE public.client_profiles
  DROP CONSTRAINT IF EXISTS client_profiles_plan_check;

-- Step 2: Re-create with 'prospect' included
ALTER TABLE public.client_profiles
  ADD CONSTRAINT client_profiles_plan_check
    CHECK (plan IS NULL OR plan IN ('single','triple','full','custom','advertising','amazon','prospect'));

-- Step 3: Add discovery_form_type column for future questionnaire routing
ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS discovery_form_type text DEFAULT 'general';

COMMENT ON COLUMN public.client_profiles.discovery_form_type IS
  'Controls which discovery questionnaire variant a prospect sees. Default is "general" (GeneralDiscoveryOnboardingForm).';
