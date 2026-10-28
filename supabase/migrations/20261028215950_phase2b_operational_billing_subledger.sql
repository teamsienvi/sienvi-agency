-- =====================================================================
-- SIENVI AGENCY: PHASE 2B OPERATIONAL BILLING SUBLEDGER
-- Migration: 20261028215950_phase2b_operational_billing_subledger.sql
-- Purpose:
--   1. Authoritative Invoice Ledger (billing_invoices) with balance constraints
--   2. Authoritative Cash Settlement Ledger (billing_payments)
--   3. Many-to-Many Payment-Invoice Allocations (billing_invoice_allocations)
--   4. Refund, Dispute & Compensating Adjustments (billing_adjustments)
--   5. Stripe Payouts & Operating Account Settlements (billing_payouts)
--   6. Bank Transfer Submissions & Verification Gate (manual_payment_submissions)
--   7. Independent Stripe Ingestion Checkpoints (stripe_sync_checkpoints)
--   8. Billing Discrepancy & Exception Queue (billing_exceptions)
--   9. Periodic Financial Reconciliation Snapshots (billing_reconciliation_snapshots)
--  10. Atomic Payment Recording Transaction (public.record_payment_transaction)
--  11. Least-Privilege RLS (anon blocked, clients scoped via get_accessible_client_profile_ids)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BILLING INVOICES (Authoritative Receivables & Obligations)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES public.client_subscriptions(id) ON DELETE SET NULL,
  legacy_one_time_payment_id uuid REFERENCES public.client_one_time_payments(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  invoice_type text NOT NULL CHECK (invoice_type IN ('recurring_subscription', 'one_time_fee', 'installment', 'manual_retainer', 'custom_service')),
  billing_channel text NOT NULL CHECK (billing_channel IN ('stripe', 'manual_ach', 'manual_wire', 'check', 'other')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'partially_paid', 'paid', 'past_due', 'void', 'uncollectible')),
  
  -- Integer Minor Units (Cents)
  subtotal_amount_cents bigint NOT NULL CHECK (subtotal_amount_cents >= 0),
  tax_amount_cents bigint NOT NULL DEFAULT 0 CHECK (tax_amount_cents >= 0),
  total_amount_cents bigint NOT NULL CHECK (total_amount_cents >= 0),
  amount_paid_cents bigint NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
  amount_due_cents bigint NOT NULL CHECK (amount_due_cents >= 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = lower(currency) AND length(currency) = 3),
  
  -- Stripe & External Identity
  stripe_invoice_id text UNIQUE,
  stripe_customer_id text,
  stripe_account_id text,
  hosted_invoice_url text,
  invoice_pdf_url text,
  description text,
  
  -- Lifecycle Timestamps
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  voided_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Balance & Accounting Invariants
  CONSTRAINT chk_billing_invoices_balance CHECK (amount_paid_cents + amount_due_cents = total_amount_cents),
  CONSTRAINT chk_billing_invoices_subtotal CHECK (subtotal_amount_cents + tax_amount_cents = total_amount_cents)
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_client ON public.billing_invoices(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_due ON public.billing_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe ON public.billing_invoices(stripe_invoice_id);

-- ---------------------------------------------------------------------
-- 2. BILLING PAYMENTS (Authoritative Cash & Collections Ledger)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid REFERENCES public.client_profiles(id) ON DELETE RESTRICT, -- Nullable for unmatched/staged Stripe transactions
  payment_channel text NOT NULL CHECK (payment_channel IN ('stripe', 'ach', 'wire', 'manual_check', 'other')),
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  
  -- Integer Minor Units (Cents)
  gross_amount_cents bigint NOT NULL CHECK (gross_amount_cents > 0),
  fee_amount_cents bigint NOT NULL DEFAULT 0 CHECK (fee_amount_cents >= 0),
  net_amount_cents bigint NOT NULL CHECK (net_amount_cents = gross_amount_cents - fee_amount_cents),
  allocated_amount_cents bigint NOT NULL DEFAULT 0 CHECK (allocated_amount_cents >= 0 AND allocated_amount_cents <= gross_amount_cents),
  unallocated_amount_cents bigint NOT NULL GENERATED ALWAYS AS (gross_amount_cents - allocated_amount_cents) STORED,
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = lower(currency) AND length(currency) = 3),
  
  -- Stripe & Banking References
  stripe_charge_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_account_id text,
  stripe_balance_transaction_id text,
  bank_reference_number text,
  payment_method_summary jsonb,
  
  -- Settlement & Reconciliation Tracking
  settled_at timestamptz NOT NULL,
  reconciled boolean NOT NULL DEFAULT false,
  reconciled_at timestamptz,
  reconciled_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_client ON public.billing_payments(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_settled ON public.billing_payments(settled_at);
CREATE INDEX IF NOT EXISTS idx_billing_payments_charge ON public.billing_payments(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_unallocated ON public.billing_payments(unallocated_amount_cents) WHERE unallocated_amount_cents > 0;

-- ---------------------------------------------------------------------
-- 3. BILLING INVOICE ALLOCATIONS (Many-to-Many Payment Application)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_invoice_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.billing_payments(id) ON DELETE RESTRICT,
  invoice_id uuid NOT NULL REFERENCES public.billing_invoices(id) ON DELETE RESTRICT,
  allocated_amount_cents bigint NOT NULL CHECK (allocated_amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = lower(currency) AND length(currency) = 3),
  allocated_at timestamptz NOT NULL DEFAULT now(),
  allocated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payment_invoice_allocation UNIQUE (payment_id, invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_allocations_payment ON public.billing_invoice_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_billing_allocations_invoice ON public.billing_invoice_allocations(invoice_id);

-- ---------------------------------------------------------------------
-- 4. BILLING ADJUSTMENTS (Refunds, Disputes & Compensating Entries)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.billing_payments(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  client_profile_id uuid REFERENCES public.client_profiles(id) ON DELETE RESTRICT,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('refund', 'dispute_deduction', 'dispute_reversal', 'write_off', 'credit_adjustment')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  fee_refund_cents bigint NOT NULL DEFAULT 0 CHECK (fee_refund_cents >= 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = lower(currency) AND length(currency) = 3),
  stripe_refund_id text UNIQUE,
  stripe_dispute_id text UNIQUE,
  stripe_account_id text,
  reason text NOT NULL,
  adjusted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_adjustments_payment ON public.billing_adjustments(payment_id);
CREATE INDEX IF NOT EXISTS idx_billing_adjustments_client ON public.billing_adjustments(client_profile_id);

-- ---------------------------------------------------------------------
-- 5. BILLING PAYOUTS (Stripe Bank Payouts — Decoupled from Collections)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payout_id text NOT NULL UNIQUE,
  stripe_account_id text,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  fee_cents bigint NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = lower(currency) AND length(currency) = 3),
  status text NOT NULL CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
  arrival_date date NOT NULL,
  destination_bank_last4 text,
  bank_statement_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_payouts_arrival ON public.billing_payouts(arrival_date);

-- ---------------------------------------------------------------------
-- 6. MANUAL PAYMENT SUBMISSIONS (Client-Reported & Admin-Verified Transfers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manual_payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = lower(currency) AND length(currency) = 3),
  sending_bank text NOT NULL,
  sender_account_name text,
  wire_reference_number text NOT NULL,
  transfer_date date NOT NULL,
  receipt_document_path text,
  notes text,
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  payment_id uuid REFERENCES public.billing_payments(id),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_manual_wire_ref UNIQUE (wire_reference_number, sending_bank)
);

CREATE INDEX IF NOT EXISTS idx_manual_payments_client ON public.manual_payment_submissions(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payment_submissions(status);

-- ---------------------------------------------------------------------
-- 7. STRIPE SYNC CHECKPOINTS (Independent Ingestion Pagination State)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_sync_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type text NOT NULL UNIQUE CHECK (object_type IN ('invoices', 'charges', 'balance_transactions', 'payouts', 'disputes')),
  last_synced_id text,
  last_synced_timestamp timestamptz,
  records_synced_total bigint NOT NULL DEFAULT 0,
  sync_status text NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'in_progress', 'failed', 'completed')),
  error_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial idle checkpoints
INSERT INTO public.stripe_sync_checkpoints (object_type, sync_status)
VALUES 
  ('invoices', 'idle'),
  ('charges', 'idle'),
  ('balance_transactions', 'idle'),
  ('payouts', 'idle'),
  ('disputes', 'idle')
ON CONFLICT (object_type) DO NOTHING;

-- ---------------------------------------------------------------------
-- 8. BILLING EXCEPTIONS (Operational Conflict & Review Queue)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid REFERENCES public.client_profiles(id) ON DELETE SET NULL,
  exception_type text NOT NULL CHECK (exception_type IN ('failed_charge', 'missing_stripe_customer', 'unmatched_transaction', 'installment_mismatch', 'overdue_manual_invoice', 'currency_mismatch', 'overpayment_unallocated')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  title text NOT NULL,
  description text NOT NULL,
  suggested_action text,
  resolution_notes text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_exceptions_status ON public.billing_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_exceptions_severity ON public.billing_exceptions(severity);

-- ---------------------------------------------------------------------
-- 9. RECONCILIATION SNAPSHOTS (Audit Trail & Verification Records)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_reconciliation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  operating_mrr_cents bigint NOT NULL,
  invoiced_mtd_cents bigint NOT NULL,
  gross_collected_mtd_cents bigint NOT NULL,
  refund_adjusted_collected_mtd_cents bigint NOT NULL,
  outstanding_receivables_cents bigint NOT NULL,
  past_due_cents bigint NOT NULL,
  unapplied_credits_cents bigint NOT NULL DEFAULT 0,
  stripe_payouts_mtd_cents bigint NOT NULL DEFAULT 0,
  discrepancy_cents bigint NOT NULL DEFAULT 0,
  reconciliation_status text NOT NULL DEFAULT 'balanced' CHECK (reconciliation_status IN ('balanced', 'flagged', 'reconciled')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 10. ATOMIC PAYMENT RECORDING TRANSACTION FUNCTION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment_transaction(
  p_client_profile_id uuid,
  p_gross_amount_cents bigint,
  p_fee_amount_cents bigint,
  p_currency text,
  p_payment_channel text,
  p_bank_ref text,
  p_stripe_charge_id text,
  p_stripe_payment_intent_id text,
  p_stripe_account_id text,
  p_settled_at timestamptz,
  p_payment_method_summary jsonb,
  p_notes text,
  p_allocations jsonb, -- Array of { invoice_id: uuid, amount_cents: bigint }
  p_manual_submission_id uuid DEFAULT NULL,
  p_admin_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := false;
  v_is_service boolean := false;
  v_payment_id uuid;
  v_total_allocated bigint := 0;
  v_alloc_elem jsonb;
  v_invoice_id uuid;
  v_alloc_cents bigint;
  v_inv public.billing_invoices%ROWTYPE;
  v_new_amount_paid bigint;
  v_new_amount_due bigint;
  v_new_status text;
  v_updated_invoices jsonb := '[]'::jsonb;
BEGIN
  -- 1. Authorization: Only administrators or service_role can execute payment transactions
  v_is_service := COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role';
  IF NOT v_is_service THEN
    IF v_caller IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: authentication required to record payments';
    END IF;
    SELECT public.has_role(v_caller, 'admin'::public.app_role) INTO v_is_admin;
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Forbidden: only administrators can record financial transactions';
    END IF;
  END IF;

  -- 2. Input Validation
  IF p_gross_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Invalid gross amount: must be positive integer cents';
  END IF;
  IF p_fee_amount_cents < 0 OR p_fee_amount_cents >= p_gross_amount_cents THEN
    RAISE EXCEPTION 'Invalid fee amount: must be non-negative and less than gross amount';
  END IF;

  -- 3. Idempotency Check (Stripe charge ID or Bank Reference)
  IF p_stripe_charge_id IS NOT NULL THEN
    SELECT id INTO v_payment_id FROM public.billing_payments WHERE stripe_charge_id = p_stripe_charge_id;
    IF v_payment_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_duplicate', true,
        'payment_id', v_payment_id,
        'message', 'Payment already recorded'
      );
    END IF;
  END IF;

  IF p_bank_ref IS NOT NULL AND p_payment_channel IN ('ach', 'wire') THEN
    SELECT id INTO v_payment_id FROM public.billing_payments WHERE bank_reference_number = p_bank_ref;
    IF v_payment_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_duplicate', true,
        'payment_id', v_payment_id,
        'message', 'Payment with this bank reference already recorded'
      );
    END IF;
  END IF;

  -- 4. Calculate Total Allocation & Validate Currency Across Allocations
  IF p_allocations IS NOT NULL AND jsonb_array_length(p_allocations) > 0 THEN
    FOR v_alloc_elem IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_alloc_cents := (v_alloc_elem->>'amount_cents')::bigint;
      IF v_alloc_cents <= 0 THEN
        RAISE EXCEPTION 'Allocation amount must be strictly positive';
      END IF;
      v_total_allocated := v_total_allocated + v_alloc_cents;
    END LOOP;

    IF v_total_allocated > p_gross_amount_cents THEN
      RAISE EXCEPTION 'Total invoice allocations (% cents) cannot exceed gross payment (% cents)',
        v_total_allocated, p_gross_amount_cents;
    END IF;
  END IF;

  -- 5. Insert billing_payments record
  INSERT INTO public.billing_payments (
    client_profile_id,
    payment_channel,
    status,
    gross_amount_cents,
    fee_amount_cents,
    net_amount_cents,
    allocated_amount_cents,
    currency,
    stripe_charge_id,
    stripe_payment_intent_id,
    stripe_account_id,
    bank_reference_number,
    payment_method_summary,
    settled_at,
    reconciled,
    reconciled_at,
    reconciled_by,
    notes
  ) VALUES (
    p_client_profile_id,
    p_payment_channel,
    'succeeded',
    p_gross_amount_cents,
    p_fee_amount_cents,
    p_gross_amount_cents - p_fee_amount_cents,
    v_total_allocated,
    lower(p_currency),
    p_stripe_charge_id,
    p_stripe_payment_intent_id,
    p_stripe_account_id,
    p_bank_ref,
    p_payment_method_summary,
    COALESCE(p_settled_at, now()),
    true,
    now(),
    COALESCE(p_admin_user_id, v_caller),
    p_notes
  ) RETURNING id INTO v_payment_id;

  -- 6. Apply Allocations to Invoices Atomically (with row locks)
  IF p_allocations IS NOT NULL AND jsonb_array_length(p_allocations) > 0 THEN
    FOR v_alloc_elem IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_invoice_id := (v_alloc_elem->>'invoice_id')::uuid;
      v_alloc_cents := (v_alloc_elem->>'amount_cents')::bigint;

      -- Lock invoice row for update
      SELECT * INTO v_inv FROM public.billing_invoices WHERE id = v_invoice_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Target invoice % not found', v_invoice_id;
      END IF;

      -- Check currency match
      IF v_inv.currency <> lower(p_currency) THEN
        RAISE EXCEPTION 'Currency mismatch: invoice % uses %, payment uses %',
          v_invoice_id, v_inv.currency, lower(p_currency);
      END IF;

      -- Check that allocation does not exceed remaining amount due
      IF v_alloc_cents > v_inv.amount_due_cents THEN
        RAISE EXCEPTION 'Cannot allocate % cents to invoice %; remaining balance is % cents',
          v_alloc_cents, v_invoice_id, v_inv.amount_due_cents;
      END IF;

      v_new_amount_paid := v_inv.amount_paid_cents + v_alloc_cents;
      v_new_amount_due := v_inv.amount_due_cents - v_alloc_cents;
      v_new_status := CASE WHEN v_new_amount_due = 0 THEN 'paid' ELSE 'partially_paid' END;

      -- Update Invoice
      UPDATE public.billing_invoices
      SET
        amount_paid_cents = v_new_amount_paid,
        amount_due_cents = v_new_amount_due,
        status = v_new_status,
        paid_at = CASE WHEN v_new_status = 'paid' THEN COALESCE(p_settled_at, now()) ELSE paid_at END,
        updated_at = now()
      WHERE id = v_invoice_id;

      -- Insert Allocation Record
      INSERT INTO public.billing_invoice_allocations (
        payment_id,
        invoice_id,
        allocated_amount_cents,
        currency,
        allocated_at,
        allocated_by
      ) VALUES (
        v_payment_id,
        v_invoice_id,
        v_alloc_cents,
        lower(p_currency),
        now(),
        COALESCE(p_admin_user_id, v_caller)
      );

      v_updated_invoices := v_updated_invoices || jsonb_build_object(
        'invoice_id', v_invoice_id,
        'allocated_cents', v_alloc_cents,
        'new_amount_due_cents', v_new_amount_due,
        'new_status', v_new_status
      );
    END LOOP;
  END IF;

  -- 7. If linked to manual_payment_submissions, mark submission verified
  IF p_manual_submission_id IS NOT NULL THEN
    UPDATE public.manual_payment_submissions
    SET
      status = 'verified',
      verified_by = COALESCE(p_admin_user_id, v_caller),
      verified_at = now(),
      payment_id = v_payment_id,
      updated_at = now()
    WHERE id = p_manual_submission_id;
  END IF;

  -- 8. If unallocated amount exists, create audit note for client credit
  IF (p_gross_amount_cents - v_total_allocated) > 0 THEN
    INSERT INTO public.billing_exceptions (
      client_profile_id,
      exception_type,
      severity,
      status,
      title,
      description,
      suggested_action,
      metadata
    ) VALUES (
      p_client_profile_id,
      'overpayment_unallocated',
      'low',
      'open',
      'Unallocated Payment Balance: ' || ((p_gross_amount_cents - v_total_allocated) / 100.0)::text || ' ' || upper(p_currency),
      'Payment ' || v_payment_id::text || ' has an unallocated balance of ' || (p_gross_amount_cents - v_total_allocated)::text || ' cents.',
      'Apply credit to future invoices or maintain on customer account.',
      jsonb_build_object('payment_id', v_payment_id, 'unallocated_cents', p_gross_amount_cents - v_total_allocated)
    );
  END IF;

  -- 9. Insert structured audit log
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    admin_email,
    action,
    target_client_id,
    details
  ) VALUES (
    COALESCE(p_admin_user_id, v_caller, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(current_setting('request.jwt.claim.email', true), 'admin@sienvi.com'),
    'admin_record_payment_transaction',
    p_client_profile_id,
    jsonb_build_object(
      'payment_id', v_payment_id,
      'gross_amount_cents', p_gross_amount_cents,
      'allocated_amount_cents', v_total_allocated,
      'unallocated_amount_cents', p_gross_amount_cents - v_total_allocated,
      'payment_channel', p_payment_channel,
      'invoices_updated', v_updated_invoices
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'gross_amount_cents', p_gross_amount_cents,
    'allocated_amount_cents', v_total_allocated,
    'unallocated_amount_cents', p_gross_amount_cents - v_total_allocated,
    'updated_invoices', v_updated_invoices
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ---------------------------------------------------------------------
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoice_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_sync_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_reconciliation_snapshots ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon
REVOKE ALL ON public.billing_invoices FROM anon;
REVOKE ALL ON public.billing_payments FROM anon;
REVOKE ALL ON public.billing_invoice_allocations FROM anon;
REVOKE ALL ON public.billing_adjustments FROM anon;
REVOKE ALL ON public.billing_payouts FROM anon;
REVOKE ALL ON public.manual_payment_submissions FROM anon;
REVOKE ALL ON public.stripe_sync_checkpoints FROM anon;
REVOKE ALL ON public.billing_exceptions FROM anon;
REVOKE ALL ON public.billing_reconciliation_snapshots FROM anon;

-- Grant access to authenticated and service_role
GRANT SELECT, INSERT, UPDATE ON public.billing_invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_invoice_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_adjustments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_payouts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.manual_payment_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stripe_sync_checkpoints TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_exceptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_reconciliation_snapshots TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ADMIN POLICIES (Full Management for Administrators)
CREATE POLICY "Admins manage billing_invoices" ON public.billing_invoices
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage billing_payments" ON public.billing_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage billing_invoice_allocations" ON public.billing_invoice_allocations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage billing_adjustments" ON public.billing_adjustments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage billing_payouts" ON public.billing_payouts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage manual_payment_submissions" ON public.manual_payment_submissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage stripe_sync_checkpoints" ON public.stripe_sync_checkpoints
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage billing_exceptions" ON public.billing_exceptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage billing_reconciliation_snapshots" ON public.billing_reconciliation_snapshots
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- CLIENT POLICIES (Scoped Read-Only via get_accessible_client_profile_ids)
CREATE POLICY "Clients view own accessible invoices" ON public.billing_invoices
  FOR SELECT USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids())
  );

CREATE POLICY "Clients view own accessible payments" ON public.billing_payments
  FOR SELECT USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids())
  );

CREATE POLICY "Clients view own accessible allocations" ON public.billing_invoice_allocations
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM public.billing_invoices 
      WHERE client_profile_id IN (SELECT public.get_accessible_client_profile_ids())
    )
  );

CREATE POLICY "Clients view own accessible adjustments" ON public.billing_adjustments
  FOR SELECT USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids())
  );

CREATE POLICY "Clients submit own transfer notice" ON public.manual_payment_submissions
  FOR INSERT WITH CHECK (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids())
    AND submitted_by = auth.uid()
    AND status = 'pending_verification'
  );

CREATE POLICY "Clients view own transfer submissions" ON public.manual_payment_submissions
  FOR SELECT USING (
    client_profile_id IN (SELECT public.get_accessible_client_profile_ids())
  );
