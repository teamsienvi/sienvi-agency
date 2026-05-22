-- Add unique constraints to client_profile_id for onboarding tables
-- This is required for Supabase .upsert() with onConflict to work correctly.

ALTER TABLE public.onboarding_goals ADD CONSTRAINT onboarding_goals_client_profile_id_key UNIQUE (client_profile_id);
ALTER TABLE public.onboarding_avatars ADD CONSTRAINT onboarding_avatars_client_profile_id_key UNIQUE (client_profile_id);
ALTER TABLE public.onboarding_questionnaire ADD CONSTRAINT onboarding_questionnaire_client_profile_id_key UNIQUE (client_profile_id);
ALTER TABLE public.onboarding_advertising ADD CONSTRAINT onboarding_advertising_client_profile_id_key UNIQUE (client_profile_id);
ALTER TABLE public.onboarding_amazon ADD CONSTRAINT onboarding_amazon_client_profile_id_key UNIQUE (client_profile_id);
