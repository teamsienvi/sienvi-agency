-- Add linked_client_profile_id to client_profiles for connecting partner/co-founder accounts
ALTER TABLE public.client_profiles 
  ADD COLUMN IF NOT EXISTS linked_client_profile_id UUID REFERENCES public.client_profiles(id) ON DELETE SET NULL;

-- Add pricing_model to client_profiles and client_subscriptions (e.g. 'flat', 'commission', 'revenue_share')
ALTER TABLE public.client_profiles 
  ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'flat';

ALTER TABLE public.client_subscriptions 
  ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'flat';

-- Create index for fast linked profile lookup
CREATE INDEX IF NOT EXISTS idx_client_profiles_linked_id 
  ON public.client_profiles (linked_client_profile_id);

-- Update RLS policies to allow linked client users to view and update shared onboarding questionnaires
CREATE OR REPLACE FUNCTION public.get_accessible_client_profile_ids(_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.client_profiles WHERE user_id = _user_id
  UNION
  SELECT linked_client_profile_id FROM public.client_profiles WHERE user_id = _user_id AND linked_client_profile_id IS NOT NULL
  UNION
  SELECT id FROM public.client_profiles WHERE linked_client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = _user_id
  );
$$;

-- Drop and re-create onboarding questionnaire policies with multi-account / linked support
DROP POLICY IF EXISTS "Users view own questionnaire" ON public.onboarding_questionnaire;
CREATE POLICY "Users view own questionnaire" ON public.onboarding_questionnaire
  FOR SELECT USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users insert own questionnaire" ON public.onboarding_questionnaire;
CREATE POLICY "Users insert own questionnaire" ON public.onboarding_questionnaire
  FOR INSERT WITH CHECK (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users update own questionnaire" ON public.onboarding_questionnaire;
CREATE POLICY "Users update own questionnaire" ON public.onboarding_questionnaire
  FOR UPDATE USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids(auth.uid()))
  );

-- Drop and re-create client_subscriptions user policy with linked support
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.client_subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.client_subscriptions
  FOR SELECT USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids(auth.uid()))
  );
