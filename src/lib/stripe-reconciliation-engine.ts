/**
 * SIENVI AGENCY: STRIPE RECONCILIATION & INGESTION STATE MACHINE
 * Resolves out-of-order events, enforces idempotency, matches customers,
 * applies monotonic state precedence, and compiles provenance-segregated reconciliation metrics.
 */

import type {
  NormalizedBillingEvent,
  StripeCustomerMapping,
  ReconciliationSummary,
  ReconciliationProvenanceScope,
} from "../types/stripe-ingestion.ts";
import type {
  BillingInvoice,
  BillingPayment,
  BillingAdjustment,
  BillingPayout,
} from "../types/billing-subledger.ts";
import {
  calculateCurrentReceivables,
  calculatePastDueReceivables,
  calculateTotalOutstandingReceivables,
  calculateGrossCollections,
  calculateRefundAdjustedCollections,
  calculateUnappliedCredits,
} from "./billing-calculations.ts";

/**
 * Matches a Stripe customer reference against known agency client profiles.
 * Distinguishes direct verified identifiers (Class A) from proposed email matches (Class B),
 * manual contract agreements (Class C), and unmapped exceptions (Class D).
 */
export function matchStripeCustomer(
  stripeCustomer: { id: string; email?: string | null; name?: string | null },
  existingProfiles: Array<{
    id: string;
    email: string;
    clientName?: string;
    stripeCustomerId?: string | null;
    isManualAgreement?: boolean;
  }>
): StripeCustomerMapping {
  // 1. Class A: Direct verified stripeCustomerId match (Authoritative)
  const directMatch = existingProfiles.find(
    (p) => p.stripeCustomerId && p.stripeCustomerId.trim() === stripeCustomer.id.trim()
  );
  if (directMatch) {
    return {
      stripeCustomerId: stripeCustomer.id,
      clientProfileId: directMatch.id,
      email: directMatch.email,
      clientName: directMatch.clientName || directMatch.email,
      isMatched: true,
      matchStrategy: "direct_stripe_id",
      evidenceClassification: "class_a_direct_verified",
      confidence: "authoritative",
      notes: "Direct match against client_profiles.stripe_customer_id.",
    };
  }

  // 2. Class B: Proposed match via verified client email (Requires administrative review)
  const customerEmail = stripeCustomer.email?.trim().toLowerCase();
  if (customerEmail) {
    const emailMatch = existingProfiles.find(
      (p) => p.email.trim().toLowerCase() === customerEmail
    );
    if (emailMatch) {
      return {
        stripeCustomerId: stripeCustomer.id,
        clientProfileId: emailMatch.id,
        email: emailMatch.email,
        clientName: emailMatch.clientName || emailMatch.email,
        isMatched: true,
        matchStrategy: "email_match",
        evidenceClassification: "class_b_proposed_email",
        confidence: "review_required",
        notes: "Proposed match via email. Requires administrative review before financial linkage.",
      };
    }
  }

  // 3. Class C: Manual agreement mapping (when specified in profile registry)
  const manualMatch = existingProfiles.find(
    (p) => p.isManualAgreement && (p.clientName === stripeCustomer.name || p.email === customerEmail)
  );
  if (manualMatch) {
    return {
      stripeCustomerId: stripeCustomer.id,
      clientProfileId: manualMatch.id,
      email: manualMatch.email,
      clientName: manualMatch.clientName || manualMatch.email,
      isMatched: true,
      matchStrategy: "manual_mapping",
      evidenceClassification: "class_c_manual_agreement",
      confidence: "authoritative",
      notes: "Contractually authorized offline retainer agreement (ACH/wire).",
    };
  }

  // 4. Class D: Unmapped customer (flagged to review queue)
  return {
    stripeCustomerId: stripeCustomer.id,
    clientProfileId: null,
    email: customerEmail || "unknown@stripe-customer.com",
    clientName: stripeCustomer.name || "Unknown Customer",
    isMatched: false,
    matchStrategy: "unmatched",
    evidenceClassification: "class_d_unmapped_exception",
    confidence: "rejected",
    notes: "No matching Sienvi client profile found. Staged in exception queue.",
  };
}

/**
 * Checks if an incoming event can transition the entity status without state regression.
 * Prevents stale out-of-order events from overwriting newer canonical source states.
 */
export function canTransitionState(
  currentPrecedence: number,
  incomingPrecedence: number,
  currentTimestamp?: string | null,
  incomingTimestamp?: string | null
): { allowed: boolean; reason: string } {
  // If incoming precedence is strictly lower, reject as stale
  if (incomingPrecedence < currentPrecedence) {
    return {
      allowed: false,
      reason: `Stale event rejected: incoming state precedence (${incomingPrecedence}) is lower than existing state precedence (${currentPrecedence}).`,
    };
  }

  // If precedence is identical, check source timestamp
  if (
    incomingPrecedence === currentPrecedence &&
    currentTimestamp &&
    incomingTimestamp &&
    new Date(incomingTimestamp).getTime() < new Date(currentTimestamp).getTime()
  ) {
    return {
      allowed: false,
      reason: `Stale event rejected: incoming timestamp (${incomingTimestamp}) is older than existing timestamp (${currentTimestamp}).`,
    };
  }

  return { allowed: true, reason: "Valid state transition." };
}

/**
 * Resolves out-of-order event ordering.
 * If a payment arrives before its invoice, it stages as unallocated.
 * When the invoice arrives, this function links unallocated payments to the invoice.
 */
export function resolveOutOfOrderAllocation(
  invoice: BillingInvoice,
  unallocatedPayments: BillingPayment[]
): {
  allocations: Array<{ paymentId: string; invoiceId: string; amountCents: number }>;
  remainingInvoiceDueCents: number;
} {
  const allocations: Array<{ paymentId: string; invoiceId: string; amountCents: number }> = [];
  let remainingDue = invoice.amountDueCents;

  for (const payment of unallocatedPayments) {
    if (remainingDue <= 0) break;
    if (payment.currency.toLowerCase() !== invoice.currency.toLowerCase()) continue;
    if (payment.unallocatedAmountCents <= 0) continue;

    // Allocate up to unallocated amount or remaining due
    const allocAmount = Math.min(payment.unallocatedAmountCents, remainingDue);
    allocations.push({
      paymentId: payment.id,
      invoiceId: invoice.id,
      amountCents: allocAmount,
    });
    remainingDue -= allocAmount;
  }

  return {
    allocations,
    remainingInvoiceDueCents: remainingDue,
  };
}

/**
 * Compiles a provenance-segregated financial reconciliation summary.
 * Strictly separates customer collections from agency payout transfers.
 */
export function compileReconciliationSummary(
  periodStart: string,
  periodEnd: string,
  contractedMrrCents: number,
  invoices: BillingInvoice[],
  payments: BillingPayment[],
  adjustments: BillingAdjustment[],
  payouts: BillingPayout[],
  unmappedCount: number = 0,
  provenanceScope: ReconciliationProvenanceScope = "simulated_test_fixtures",
  now: Date = new Date()
): ReconciliationSummary {
  const invoicedAmountCents = invoices.reduce((sum, inv) => sum + inv.totalAmountCents, 0);
  const grossCollectionsCents = calculateGrossCollections(payments, "usd");
  const refundAdjustedCollectionsCents = calculateRefundAdjustedCollections(payments, adjustments, "usd");
  const totalStripeFeesCents = payments.reduce((sum, p) => sum + p.feeAmountCents, 0);

  // Payout transfers: Transfers to agency bank accounts, NEVER customer revenue
  const totalPayoutsCents = payouts
    .filter((po) => po.status === "paid")
    .reduce((sum, po) => sum + po.amountCents, 0);

  const currentReceivablesCents = calculateCurrentReceivables(invoices, now, "usd");
  const pastDueReceivablesCents = calculatePastDueReceivables(invoices, now, "usd");
  const totalOutstandingReceivablesCents = calculateTotalOutstandingReceivables(invoices, now, "usd");
  const unappliedCreditsCents = calculateUnappliedCredits(payments, "usd");

  const discrepancies: Array<{ type: string; description: string; amountCents: number }> = [];

  // Check 1: Invoiced vs Collections + Receivables conservation
  const totalAllocatedCents = payments.reduce((sum, p) => sum + p.allocatedAmountCents, 0);
  const totalAmountDueCents = invoices.reduce((sum, inv) => sum + inv.amountDueCents, 0);
  if (totalAllocatedCents + totalAmountDueCents !== invoicedAmountCents) {
    discrepancies.push({
      type: "allocation_balance_mismatch",
      description: `Invoiced total (${invoicedAmountCents}) does not equal allocated cash (${totalAllocatedCents}) + balance due (${totalAmountDueCents})`,
      amountCents: Math.abs(invoicedAmountCents - (totalAllocatedCents + totalAmountDueCents)),
    });
  }

  // Check 2: Unapplied credit tracking
  if (unappliedCreditsCents > 0) {
    discrepancies.push({
      type: "unapplied_customer_credit",
      description: `Found ${unappliedCreditsCents} cents unapplied customer credit residing on accounts`,
      amountCents: unappliedCreditsCents,
    });
  }

  // Check 3: Unmapped Stripe customers
  if (unmappedCount > 0) {
    discrepancies.push({
      type: "unmapped_stripe_customers",
      description: `${unmappedCount} Stripe transactions could not be matched to an active Sienvi client profile`,
      amountCents: 0,
    });
  }

  const environmentLabel =
    provenanceScope === "simulated_test_fixtures"
      ? "TEST / SIMULATED FIXTURES"
      : provenanceScope === "verified_production_supabase"
      ? "VERIFIED PRODUCTION BASELINE"
      : "UNMATCHED EXCEPTION QUEUE";

  const reconciliationStatus = discrepancies.length === 0 ? "balanced" : "reconciliation_pending";

  return {
    provenanceScope,
    environmentLabel,
    periodStart,
    periodEnd,
    contractedMrrCents,
    invoicedAmountCents,
    grossCollectionsCents,
    refundAdjustedCollectionsCents,
    totalStripeFeesCents,
    totalPayoutsCents,
    currentReceivablesCents,
    pastDueReceivablesCents,
    totalOutstandingReceivablesCents,
    unappliedCreditsCents,
    unmappedCustomersCount: unmappedCount,
    reconciliationStatus,
    discrepancies,
  };
}
