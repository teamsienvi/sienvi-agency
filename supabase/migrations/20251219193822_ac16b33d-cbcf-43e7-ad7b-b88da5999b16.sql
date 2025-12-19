-- Add visitor_id column to analytics_page_views if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'analytics_page_views' 
    AND column_name = 'visitor_id'
  ) THEN
    ALTER TABLE public.analytics_page_views ADD COLUMN visitor_id text;
  END IF;
END $$;

-- Create the default admin user in profiles (user needs to be created via Supabase Auth first)
-- We'll insert the admin role once the user signs up with the provided credentials

-- Create a function to automatically assign admin role for specific email
CREATE OR REPLACE FUNCTION public.assign_admin_for_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign admin role for the designated admin email
  IF NEW.email = 'admin@sienvi.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin role on profile creation
DROP TRIGGER IF EXISTS assign_admin_role_trigger ON public.profiles;
CREATE TRIGGER assign_admin_role_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_for_email();