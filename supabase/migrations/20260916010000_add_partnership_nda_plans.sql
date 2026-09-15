-- Allow 'partnership' and 'nda' in client_profiles plan check constraint
ALTER TABLE client_profiles DROP CONSTRAINT IF EXISTS client_profiles_plan_check;
ALTER TABLE client_profiles ADD CONSTRAINT client_profiles_plan_check 
  CHECK (plan IS NULL OR plan = ANY (ARRAY['single'::text, 'triple'::text, 'full'::text, 'custom'::text, 'advertising'::text, 'amazon'::text, 'prospect'::text, 'partnership'::text, 'nda'::text]));
