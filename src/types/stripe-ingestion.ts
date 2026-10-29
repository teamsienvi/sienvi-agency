/**
 * SIENVI AGENCY: PHASE 2B SPRINT 2 - STRIPE INGESTION & RECONCILIATION TYPES
 * Authoritative TypeScript interfaces for read-only Stripe data extraction,
 * event normalization, checkpointing, and subledger reconciliation.
 */

export type StripeObjectType =
  | "customers"
  | "subscriptions"
  | "invoices"
  | "charges"
  | "payment_intents"
  | "refunds"
  | "disputes"
  | "balance_transactions"
  | "payouts";

export type NormalizedEventType =
  | "customer.created"
  | "customer.updated"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.deleted"
  | "invoice.created"
  | "invoice.updated"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "invoice.marked_uncollectible"
  | "invoice.voided"
  | "charge.succeeded"
  | "charge.failed"
  | "charge.refunded"
  | "refund.created"
  | "refund.updated"
  | "dispute.created"
  | "dispute.updated"
  | "dispute.closed"
  | "payout.created"
  | "payout.paid"
  | "payout.failed"
  | "payout.canceled";

export type IngestionProcessingStatus =
  | "staged"
  | "processed"
  | "skipped_duplicate"
  | "flagged_unmapped"
  | "rejected_stale"
  | "rejected_testmode_in_live"
  | "failed";

export type EvidenceClassification =
  | "class_a_direct_verified"    // Direct match on stripe_customer_id / stripe_subscription_id
  | "class_b_proposed_email"      // Match on verified client email (requires review)
  | "class_c_manual_agreement"   // Verified contract agreement (manual ACH/wire retainer)
  | "class_d_unmapped_exception"; // No match found (exception queue)

/**
 * Normalized billing event for the operational subledger.
 * Deterministic format decoupled from raw provider quirks.
 */
export interface NormalizedBillingEvent {
  sourceSystem: "stripe";
  stripeAccountId: string | null;
  livemode: boolean; // Segregate live vs testmode Stripe events
  externalObjectId: string; // e.g. ch_..., in_..., re_..., dp_..., po_...
  eventId: string | null; // e.g. evt_... (from webhooks)
  eventType: NormalizedEventType;
  customerReference: string | null; // cus_...
  invoiceReference: string | null; // in_...
  paymentReference: string | null; // ch_... or pi_...
  amountCents: number; // Integer minor units (positive)
  feeAmountCents: number;
  netAmountCents: number;
  currency: string; // Lowercase ISO 3-letter (e.g. "usd")
  sourceStatus: string; // Provider status
  sourceCreatedAt: string; // ISO 8601
  sourceSettledAt: string | null; // ISO 8601
  ingestionTimestamp: string; // ISO 8601
  processingStatus: IngestionProcessingStatus;
  idempotencyKey: string;
  isPayout?: boolean; // Payouts MUST NEVER inflate customer revenue
  statePrecedence: number; // Monotonic priority preventing stale state regression
  metadata: Record<string, unknown>;
}

/**
 * Sync checkpoint state stored in stripe_sync_checkpoints.
 */
export interface StripeSyncCheckpoint {
  id?: string;
  objectType: StripeObjectType;
  lastSyncedId: string | null;
  lastSyncedTimestamp: string | null;
  recordsSyncedTotal: number;
  syncStatus: "idle" | "in_progress" | "failed" | "completed";
  errorMessage: string | null;
  updatedAt?: string;
}

/**
 * Mapping between Stripe customer IDs and Sienvi client profiles.
 */
export interface StripeCustomerMapping {
  stripeCustomerId: string;
  clientProfileId: string | null;
  email: string;
  clientName: string;
  isMatched: boolean;
  matchStrategy: "direct_stripe_id" | "email_match" | "manual_mapping" | "unmatched";
  evidenceClassification: EvidenceClassification;
  confidence: "authoritative" | "review_required" | "rejected";
  notes?: string;
}

/**
 * Provenance category for reconciliation reports.
 */
export type ReconciliationProvenanceScope =
  | "simulated_test_fixtures"
  | "verified_production_supabase"
  | "unmatched_exception_records";

/**
 * Historical reconciliation audit summary.
 */
export interface ReconciliationSummary {
  provenanceScope: ReconciliationProvenanceScope;
  environmentLabel: string;
  periodStart: string;
  periodEnd: string;
  contractedMrrCents: number;
  invoicedAmountCents: number;
  grossCollectionsCents: number;
  refundAdjustedCollectionsCents: number;
  totalStripeFeesCents: number;
  totalPayoutsCents: number;
  currentReceivablesCents: number;
  pastDueReceivablesCents: number;
  totalOutstandingReceivablesCents: number;
  unappliedCreditsCents: number;
  unmappedCustomersCount: number;
  reconciliationStatus: "balanced" | "flagged" | "reconciliation_pending";
  discrepancies: Array<{
    type: string;
    description: string;
    amountCents: number;
  }>;
}

/**
 * Configuration options for the read-only Stripe extraction client.
 */
export interface StripeExtractionConfig {
  apiKey: string;
  stripeAccountId?: string;
  livemode?: boolean;
  maxRetries?: number;
  batchSize?: number;
  requestTimeoutMs?: number;
  dryRun?: boolean;
}
