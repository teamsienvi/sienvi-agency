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
  | "dispute.created"
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
  | "failed";

/**
 * Normalized billing event for the operational subledger.
 * Deterministic format decoupled from raw provider quirks.
 */
export interface NormalizedBillingEvent {
  sourceSystem: "stripe";
  stripeAccountId: string | null;
  externalObjectId: string; // e.g. ch_..., in_..., po_...
  eventId: string | null; // e.g. evt_...
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
}

/**
 * Historical reconciliation audit summary.
 */
export interface ReconciliationSummary {
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
  maxRetries?: number;
  batchSize?: number;
  requestTimeoutMs?: number;
  dryRun?: boolean;
}
