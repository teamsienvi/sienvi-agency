-- =====================================================================
-- SIENVI AGENCY: CLOSE REMAINING OPEN POLICIES (follow-up to 20261028000000)
-- Migration: 20261030000000_close_remaining_open_policies.sql
-- Purpose:
--   Policies named "Service role ..." / "System ..." were created without a
--   TO service_role clause, so they applied to every role including anon.
--   The service role bypasses RLS, so these policies were never needed for
--   edge functions; they only opened the tables to the public anon key.
--
--   Verified 2026-10-30 with the public anon key (row count only):
--     email_reminders -> 9 rows readable (and writable via WITH CHECK (true)).
--
--   Consumers checked: send-reminders edge function (service role) and the
--   verify_coach_credentials SECURITY DEFINER RPC. No frontend usage.
-- =====================================================================

-- email_reminders: admin policy remains; drop the all-roles policy
DROP POLICY IF EXISTS "Service role manages email reminders" ON public.email_reminders;
REVOKE ALL ON public.email_reminders FROM anon;
GRANT ALL ON public.email_reminders TO service_role;

-- newsletter_subscribers: keep anonymous sign-up inserts; drop all-roles read/update/delete
DROP POLICY IF EXISTS "Allow service role full access" ON public.newsletter_subscribers;
GRANT ALL ON public.newsletter_subscribers TO service_role;

-- coach_credentials: anyone could UPDATE any row; only the SECURITY DEFINER RPC needs it
DROP POLICY IF EXISTS "System can update coach credentials" ON public.coach_credentials;
REVOKE UPDATE, DELETE ON public.coach_credentials FROM anon;
GRANT ALL ON public.coach_credentials TO service_role;
