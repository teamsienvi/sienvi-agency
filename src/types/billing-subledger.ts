/**
 * SIENVI AGENCY: PHASE 2B OPERATIONAL BILLING SUBLEDGER TYPES
 * Authoritative domain interfaces for invoice receivables, cash collections,
 * many-to-many allocations, adjustments, and reconciliation.
 */

export type InvoiceType =
  | "recurring_subscription"
  | "one_time_fee"
  | "installment"
  | "manual_retainer"
  | "custom_service";

export type BillingChannel =
  | "stripe"
  | "manual_ach"
  | "manual_wire"
  | "check"
  | "other";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "partially_paid"
  | "paid"
  | "past_due"
  | "void"
  | "uncollectible";

export type PaymentChannel = "stripe" | "ach" | "wire" | "manual_check" | "other";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "canceled";

export type AdjustmentType =
  | "refund"
  | "dispute_deduction"
  | "dispute_reversal"
  | "write_off"
  | "credit_adjustment";

export type PayoutStatus =
  | "pending"
  | "in_transit"
  | "paid"
  | "failed"
  | "canceled";

export type ManualSubmissionStatus =
  | "pending_verification"
  | "verified"
  | "rejected";

export type ExceptionSeverity = "low" | "medium" | "high" | "critical";

export type ExceptionStatus = "open" | "investigating" | "resolved" | "dismissed";

export interface BillingInvoice {
  id: string;
  clientProfileId: string;
  subscriptionId?: string | null;
  legacyOneTimePaymentId?: string | null;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  billingChannel: BillingChannel;
  status: InvoiceStatus;
  subtotalAmountCents: number;
  taxAmountCents: number;
  totalAmountCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  currency: string;
  stripeInvoiceId?: string | null;
  stripeCustomerId?: string | null;
  stripeAccountId?: string | null;
  hostedInvoiceUrl?: string | null;
  invoicePdfUrl?: string | null;
  description?: string | null;
  issuedAt: string;
  dueDate: string;
  paidAt?: string | null;
  voidedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPayment {
  id: string;
  clientProfileId?: string | null;
  paymentChannel: PaymentChannel;
  status: PaymentStatus;
  grossAmountCents: number;
  feeAmountCents: number;
  netAmountCents: number;
  allocatedAmountCents: number;
  unallocatedAmountCents: number;
  currency: string;
  stripeChargeId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeAccountId?: string | null;
  stripeBalanceTransactionId?: string | null;
  bankReferenceNumber?: string | null;
  paymentMethodSummary?: {
    type?: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    bankName?: string;
  } | null;
  settledAt: string;
  reconciled: boolean;
  reconciledAt?: string | null;
  reconciledBy?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoiceAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  allocatedAmountCents: number;
  currency: string;
  allocatedAt: string;
  allocatedBy?: string | null;
  createdAt: string;
}

export interface BillingAdjustment {
  id: string;
  paymentId: string;
  invoiceId?: string | null;
  clientProfileId: string;
  adjustmentType: AdjustmentType;
  amountCents: number;
  feeRefundCents: number;
  currency: string;
  stripeRefundId?: string | null;
  stripeDisputeId?: string | null;
  stripeAccountId?: string | null;
  reason: string;
  adjustedAt: string;
  createdBy?: string | null;
  createdAt: string;
}

export interface BillingPayout {
  id: string;
  stripePayoutId: string;
  stripeAccountId?: string | null;
  amountCents: number;
  feeCents: number;
  currency: string;
  status: PayoutStatus;
  arrivalDate: string;
  destinationBankLast4?: string | null;
  bankStatementReference?: string | null;
  createdAt: string;
}

export interface ManualPaymentSubmission {
  id: string;
  clientProfileId: string;
  invoiceId?: string | null;
  amountCents: number;
  currency: string;
  sendingBank: string;
  senderAccountName?: string | null;
  wireReferenceNumber: string;
  transferDate: string;
  receiptDocumentPath?: string | null;
  notes?: string | null;
  status: ManualSubmissionStatus;
  submittedBy: string;
  submittedAt: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  paymentId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StripeSyncCheckpoint {
  id: string;
  objectType: "invoices" | "charges" | "balance_transactions" | "payouts" | "disputes";
  lastSyncedId?: string | null;
  lastSyncedTimestamp?: string | null;
  recordsSyncedTotal: number;
  syncStatus: "idle" | "in_progress" | "failed" | "completed";
  errorMessage?: string | null;
  updatedAt: string;
}

export interface BillingException {
  id: string;
  clientProfileId?: string | null;
  exceptionType:
    | "failed_charge"
    | "missing_stripe_customer"
    | "unmatched_transaction"
    | "installment_mismatch"
    | "overdue_manual_invoice"
    | "currency_mismatch"
    | "overpayment_unallocated";
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  description: string;
  suggestedAction?: string | null;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingReconciliationSnapshot {
  id: string;
  snapshotDate: string;
  operatingMrrCents: number;
  invoicedMtdCents: number;
  grossCollectedMtdCents: number;
  refundAdjustedCollectedMtdCents: number;
  outstandingReceivablesCents: number;
  pastDueCents: number;
  unappliedCreditsCents: number;
  stripePayoutsMtdCents: number;
  discrepancyCents: number;
  reconciliationStatus: "balanced" | "flagged" | "reconciled";
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaymentAllocationInput {
  invoice_id: string;
  amount_cents: number;
}

export interface RecordPaymentTransactionParams {
  clientProfileId: string;
  grossAmountCents: number;
  feeAmountCents?: number;
  currency?: string;
  paymentChannel: PaymentChannel;
  bankRef?: string | null;
  stripeChargeId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeAccountId?: string | null;
  settledAt?: string;
  paymentMethodSummary?: Record<string, unknown> | null;
  notes?: string | null;
  allocations?: PaymentAllocationInput[];
  manualSubmissionId?: string | null;
  adminUserId?: string | null;
}

export interface RecordPaymentTransactionResult {
  success: boolean;
  payment_id: string;
  gross_amount_cents: number;
  allocated_amount_cents: number;
  unallocated_amount_cents: number;
  updated_invoices: Array<{
    invoice_id: string;
    allocated_cents: number;
    new_amount_due_cents: number;
    new_status: InvoiceStatus;
  }>;
  idempotent_duplicate?: boolean;
  message?: string;
}

/**
 * Authoritative financial definitions for calculations & aggregates.
 */
export interface AuthoritativeFinancialMetrics {
  operatingMrrCents: number; // Contracted recurring monthly commitment from active client_subscriptions
  invoicedMtdCents: number; // Sum of invoices issued in current month
  grossCustomerCollectionsCents: number; // Sum of all settled customer payments (gross)
  refundAdjustedCollectionsCents: number; // Gross collections minus total refunds/disputes
  outstandingReceivablesCents: number; // Open invoices not yet past due
  pastDueBalancesCents: number; // Open invoices past due + past-due retainers
  stripeFeesCents: number; // Sum of processing fees deducted
  payoutsSettledCents: number; // Cash transferred to agency bank account via Stripe payouts
  verifiedBankDepositsCents: number; // Direct ACH/wire payments confirmed in agency bank
  unappliedCustomerCreditsCents: number; // Gross payments received exceeding allocated invoice amounts
  reconciliationStatus: "reconciliation_pending" | "verified" | "discrepancy_flagged";
}
