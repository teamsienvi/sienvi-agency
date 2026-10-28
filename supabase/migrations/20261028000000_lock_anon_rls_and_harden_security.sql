-- =====================================================================
-- SIENVI AGENCY: SECURITY REMEDIATION MIGRATION (CORRECTED LEAST-PRIVILEGE)
-- Migration: 20261028000000_lock_anon_rls_and_harden_security.sql
-- Purpose:
--   1. Revoke public/anonymous CRUD privileges on sensitive client tables
--   2. Drop dangerous "FOR ALL USING (true)" open policies
--   3. Enforce canonical client ownership and linked co-founder access
--   4. Eliminate direct auth.users queries in RLS expressions (use auth.jwt())
--   5. Enforce safe search_path and ownership on security definer helper functions
--   6. Prevent cross-client document access on storage.objects via exact key resolution
--   7. Set storage.buckets(contracts).public = false to disable unauthenticated CDN downloads
--   8. Maintain service-role BYPASSRLS for Stripe webhooks and background jobs
--   9. Create admin audit log table for tracking administrative access
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SECURITY DEFINER FUNCTIONS (SAFE SEARCH PATH & IDENTITY ESCALATION GUARDS)
-- ---------------------------------------------------------------------

-- Canonical role check function with explicit search_path, null guard, and identity protection
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- BINDING PROTECTION:
  -- If caller is an authenticated user attempting to inspect ANOTHER user's role:
  -- Only allow if the caller is that user, or caller is admin, or service_role.
  IF v_caller IS NOT NULL AND _user_id IS DISTINCT FROM v_caller THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = v_caller AND role = 'admin'::public.app_role
    ) AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
      RETURN false; -- Hide role metadata from non-admins to prevent role enumeration
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Caller-bound overload (uses auth.uid() by default)
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT public.has_role(auth.uid(), _role);
$$;

-- Canonical accessible client profile resolver with caller-binding & identity escalation guard
CREATE OR REPLACE FUNCTION public.get_accessible_client_profile_ids(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_target uuid := COALESCE(_user_id, v_caller);
BEGIN
  -- If unauthenticated caller and not service_role, return empty
  IF v_caller IS NULL AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RETURN;
  END IF;

  -- IDENTITY ESCALATION GUARD:
  -- If an authenticated caller attempts to inspect another user's accessible profiles,
  -- verify whether the caller is an administrator or service_role.
  -- Reject caller-supplied victim UUIDs with access denial.
  IF v_caller IS NOT NULL AND v_target IS DISTINCT FROM v_caller THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = v_caller AND role = 'admin'::public.app_role
    ) AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Access denied: cannot enumerate profiles of another user';
    END IF;
  END IF;

  RETURN QUERY
    SELECT id FROM public.client_profiles WHERE user_id = v_target
    UNION
    SELECT linked_client_profile_id FROM public.client_profiles 
      WHERE user_id = v_target AND linked_client_profile_id IS NOT NULL
    UNION
    SELECT id FROM public.client_profiles 
      WHERE linked_client_profile_id IN (
        SELECT id FROM public.client_profiles WHERE user_id = v_target
      );
END;
$$;

-- Exact authorized contract storage key resolver with caller-binding & identity escalation guard
CREATE OR REPLACE FUNCTION public.get_authorized_contract_storage_keys(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_target uuid := COALESCE(_user_id, v_caller);
BEGIN
  IF v_caller IS NULL AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RETURN;
  END IF;

  -- IDENTITY ESCALATION GUARD:
  IF v_caller IS NOT NULL AND v_target IS DISTINCT FROM v_caller THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = v_caller AND role = 'admin'::public.app_role
    ) AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Access denied: cannot enumerate storage keys of another user';
    END IF;
  END IF;

  RETURN QUERY
    -- 1. Exact contract documents from client_profiles (primary and linked)
    SELECT NULLIF(split_part(contract_details->>'uploadedContractUrl', '/contracts/', 2), '')
    FROM public.client_profiles
    WHERE id IN (SELECT public.get_accessible_client_profile_ids(v_target))
      AND contract_details->>'uploadedContractUrl' IS NOT NULL
    
    UNION
    
    -- 2. Exact proposal documents from client_profiles (primary and linked)
    SELECT NULLIF(split_part(contract_details->>'uploadedProposalUrl', '/contracts/', 2), '')
    FROM public.client_profiles
    WHERE id IN (SELECT public.get_accessible_client_profile_ids(v_target))
      AND contract_details->>'uploadedProposalUrl' IS NOT NULL
      
    UNION
    
    -- 3. Exact per-subscription contract documents
    SELECT NULLIF(split_part(cs.contract_details->>'uploadedContractUrl', '/contracts/', 2), '')
    FROM public.client_subscriptions cs
    WHERE cs.client_profile_id IN (SELECT public.get_accessible_client_profile_ids(v_target))
      AND cs.contract_details->>'uploadedContractUrl' IS NOT NULL;
END;
$$;

-- Function execution grants
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_accessible_client_profile_ids(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_accessible_client_profile_ids(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_authorized_contract_storage_keys(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_authorized_contract_storage_keys(uuid) TO authenticated, service_role;


-- ---------------------------------------------------------------------
-- 2. SCHEMA GRANTS & PRIVILEGE HARDENING
-- ---------------------------------------------------------------------
-- Revoke all privileges from anon on sensitive client and onboarding tables
REVOKE ALL ON public.client_profiles FROM anon;
REVOKE ALL ON public.client_subscriptions FROM anon;
REVOKE ALL ON public.subscriptions FROM anon;
REVOKE ALL ON public.contracts FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.client_one_time_payments FROM anon;
REVOKE ALL ON public.onboarding_questionnaire FROM anon;
REVOKE ALL ON public.onboarding_avatars FROM anon;
REVOKE ALL ON public.onboarding_goals FROM anon;
REVOKE ALL ON public.onboarding_advertising FROM anon;
REVOKE ALL ON public.onboarding_amazon FROM anon;

-- Grant authenticated least-privilege table access (RLS will govern rows)
GRANT SELECT, UPDATE ON public.client_profiles TO authenticated;
GRANT SELECT ON public.client_subscriptions TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT, UPDATE ON public.contracts TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.client_one_time_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_questionnaire TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_avatars TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_advertising TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_amazon TO authenticated;

-- Service role retains full administrative privileges
GRANT ALL ON public.client_profiles TO service_role;
GRANT ALL ON public.client_subscriptions TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.contracts TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.client_one_time_payments TO service_role;
GRANT ALL ON public.onboarding_questionnaire TO service_role;
GRANT ALL ON public.onboarding_avatars TO service_role;
GRANT ALL ON public.onboarding_goals TO service_role;
GRANT ALL ON public.onboarding_advertising TO service_role;
GRANT ALL ON public.onboarding_amazon TO service_role;


-- ---------------------------------------------------------------------
-- 3. DROP DANGEROUS OPEN POLICIES (CONTAINMENT)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role manages client profiles" ON public.client_profiles;
DROP POLICY IF EXISTS "Service role manages client subscriptions" ON public.client_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow public read access to contracts bucket" ON storage.objects;


-- ---------------------------------------------------------------------
-- 4. HARDEN client_profiles RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles FORCE ROW LEVEL SECURITY;

-- Admins: Full administrative CRUD
DROP POLICY IF EXISTS "Admins full access to client profiles" ON public.client_profiles;
CREATE POLICY "Admins full access to client profiles" ON public.client_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Clients: View own and linked co-founder profiles
DROP POLICY IF EXISTS "Users can view own client profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Clients view own and linked profiles" ON public.client_profiles;
CREATE POLICY "Clients view own and linked profiles" ON public.client_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR id IN (SELECT public.get_accessible_client_profile_ids(auth.uid()))
  );

-- Clients: Update own client profile record only (self-service settings)
DROP POLICY IF EXISTS "Users can update own client profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Clients update own profile" ON public.client_profiles;
CREATE POLICY "Clients update own profile" ON public.client_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 5. HARDEN client_subscriptions RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions FORCE ROW LEVEL SECURITY;

-- Admins: Full administrative CRUD
DROP POLICY IF EXISTS "Admins full access to client subscriptions" ON public.client_subscriptions;
CREATE POLICY "Admins full access to client subscriptions" ON public.client_subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Clients: View subscriptions for own and linked accounts
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.client_subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.client_subscriptions
  FOR SELECT TO authenticated
  USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids(auth.uid()))
  );


-- ---------------------------------------------------------------------
-- 6. HARDEN subscriptions (LEGACY TABLE) RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

-- Admins: Full administrative CRUD
DROP POLICY IF EXISTS "Admins full access to subscriptions" ON public.subscriptions;
CREATE POLICY "Admins full access to subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Clients: View legacy subscriptions matching validated JWT email (no auth.users query)
DROP POLICY IF EXISTS "Clients view own legacy subscriptions" ON public.subscriptions;
CREATE POLICY "Clients view own legacy subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND email IS NOT NULL
    AND lower(email) = lower(auth.jwt() ->> 'email')
  );


-- ---------------------------------------------------------------------
-- 7. HARDEN contracts TABLE RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts FORCE ROW LEVEL SECURITY;

-- Admins: Full administrative access
DROP POLICY IF EXISTS "Admins full access to contracts" ON public.contracts;
CREATE POLICY "Admins full access to contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Clients: View own contract record
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.contracts;
CREATE POLICY "Users can view their own contracts" ON public.contracts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Clients: Update own contract record (e.g. signing)
DROP POLICY IF EXISTS "Users can update their own contracts" ON public.contracts;
CREATE POLICY "Users can update their own contracts" ON public.contracts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 8. HARDEN storage.objects (CONTRACTS BUCKET)
-- ---------------------------------------------------------------------
-- Set contracts bucket to private to disable unauthenticated CDN downloads
UPDATE storage.buckets SET public = false WHERE id = 'contracts';

-- Admins: Full access to contracts storage
DROP POLICY IF EXISTS "Admins full access to contracts storage" ON storage.objects;
CREATE POLICY "Admins full access to contracts storage" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'contracts'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'contracts'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Clients: Strict document-level ownership check via exact key resolution
-- A client can only read contract objects that match their own profile or subscription records
DROP POLICY IF EXISTS "Authenticated users view contracts" ON storage.objects;
DROP POLICY IF EXISTS "Clients view own contracts only" ON storage.objects;
CREATE POLICY "Clients view own contracts only" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR name IN (SELECT public.get_authorized_contract_storage_keys(auth.uid()))
    )
  );


-- ---------------------------------------------------------------------
-- 9. AUDIT LOGGING: admin_audit_logs TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_client_id uuid REFERENCES public.client_profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_client_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins full access to audit logs" ON public.admin_audit_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
