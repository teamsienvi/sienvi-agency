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
  currentReceivablesCents: number;
  pastDueReceivablesCents: number;
  totalOutstandingReceivablesCents: number;
  pastDueMrrCents: number;
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
  operatingMrrCents: number; // Contracted recurring monthly commitment from active client_subscriptions ($15,783.00 baseline)
  invoicedMtdCents: number; // Sum of invoices issued in current month
  grossCustomerCollectionsCents: number; // Sum of all settled customer payments (gross)
  refundAdjustedCollectionsCents: number; // Gross collections minus total refunds/disputes
  currentReceivablesCents: number; // Open invoices not yet past due
  pastDueReceivablesCents: number; // Open invoices past due date
  totalOutstandingReceivablesCents: number; // Current Receivables + Past-Due Receivables (all outstanding debt)
  pastDueMrrCents: number; // Past-due recurring retainers (e.g. Susie Jung Hea Oh $2,450.00/mo)
  stripeFeesCents: number; // Sum of processing fees deducted
  payoutsSettledCents: number; // Cash transferred to agency bank account via Stripe payouts (segregated)
  verifiedBankDepositsCents: number; // Direct ACH/wire payments confirmed in agency bank
  unappliedCustomerCreditsCents: number; // Gross payments received exceeding allocated invoice amounts
  reconciliationStatus: "reconciliation_pending" | "verified" | "discrepancy_flagged";
}

// =========================================================================
// SPRINT 4 FIVE-TAB MODULE API & UI INTEGRATION CONTRACTS
// =========================================================================

export type SourceValidationClass =
  | "class_a_supabase"
  | "class_b_stripe_verified"
  | "class_c_proposed_email"
  | "class_d_manual_agreement"
  | "class_e_unmatched";

export interface SourceValidationCounts {
  classA_supabase: number;
  classB_stripeVerified: number;
  classC_proposedEmail: number;
  classD_manualAgreement: number;
  classE_unmatched: number;
}

export interface BillingOverviewKpis {
  operatingMrrCents: number;
  operatingMrrFormatted: string;
  stripeMrrCents: number;
  stripeMrrFormatted: string;
  manualMrrCents: number;
  manualMrrFormatted: string;
  pastDueMrrCents: number;
  pendingMrrCents: number;
  activePayingRetainersCount: number;
  totalSubscriptionLinesCount: number;
  collectedRevenueMtdCents: number;
  collectedRevenueStatus: "reconciliation_pending" | "reconciled" | "discrepancy_flagged";
  openInvoicesTotalCents: number;
  pastDueInvoicesTotalCents: number;
  openExceptionsCount: number;
  sourceValidationCounts: SourceValidationCounts;
}

export interface AdminSubscriptionItem {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  label: string;
  plan: string;
  monthlyAmountCents: number;
  billingDay: number;
  subscriptionStatus: string;
  billingChannel: "stripe_automated" | "manual_retainer";
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  sourceValidationClass: SourceValidationClass;
  nextBillingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvoiceItem {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  description: string;
  totalAmountCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  currency: string;
  status: "open" | "paid" | "past_due" | "partially_paid" | "void";
  dueDate: string;
  paidAt: string | null;
  billingChannel: "stripe" | "manual_ach" | "manual_wire" | "other";
  stripeInvoiceId: string | null;
  createdAt: string;
}

export interface AdminPaymentItem {
  id: string;
  clientId: string;
  clientName: string;
  paymentChannel: "stripe" | "ach" | "wire" | "manual_check" | "other";
  status: "pending" | "succeeded" | "failed" | "canceled";
  grossAmountCents: number;
  feeAmountCents: number;
  netAmountCents: number;
  currency: string;
  bankReferenceNumber: string;
  sendingBank?: string;
  settledAt: string;
  reconciled: boolean;
  reconciledAt: string | null;
  evidenceStatus?: "pending_verification" | "verified" | "rejected";
  notes?: string;
}

export interface AdminExceptionItem {
  id: string;
  clientId: string;
  clientName: string;
  exceptionType: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "dismissed";
  title: string;
  description: string;
  suggestedAction?: string;
  createdAt: string;
}

export interface AdminAuditItem {
  id: string;
  admin_user_id: string;
  action: string;
  category?: "financial" | "operational" | "security";
  target_client_id?: string | null;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminBillingOverviewResponse {
  dataFreshness: {
    asOf: string;
    isLiveStripe: boolean;
    subledgerActive: boolean;
    cacheTtlSeconds: number;
  };
  overview: BillingOverviewKpis;
  subscriptions: PaginatedResult<AdminSubscriptionItem>;
  invoices: PaginatedResult<AdminInvoiceItem>;
  payments: PaginatedResult<AdminPaymentItem>;
  exceptions: PaginatedResult<AdminExceptionItem>;
  auditLogs: PaginatedResult<AdminAuditItem>;
}

export interface VerifyManualPaymentRequest {
  action: "verify_manual_payment";
  clientId: string;
  subscriptionId?: string;
  verifiedAmountCents: number;
  clearedBankRef: string;
  clearedDate?: string;
  matchedInvoiceIds?: Array<{ invoiceId: string; amountCents: number }>;
  notes?: string;
}

export interface VerifyManualPaymentResponse {
  success: boolean;
  verifiedAmountCents: number;
  bankReference: string;
  clientProfileId: string;
  subscriptionId: string | null;
  subledgerPaymentId: string | null;
  status: "verified";
  message: string;
}

export interface ResolveBillingExceptionRequest {
  action: "resolve_billing_exception";
  exceptionId: string;
  resolutionNotes: string;
}

