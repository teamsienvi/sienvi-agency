-- Add contract_details column to client_profiles table
ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS contract_details jsonb;
