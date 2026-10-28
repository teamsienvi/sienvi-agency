/**
 * SIENVI AGENCY: STRIPE RECONCILIATION & INGESTION STATE MACHINE
 * Resolves out-of-order events, enforces idempotency, matches customers,
 * and compiles comprehensive reconciliation metrics for the operational subledger.
 */

import type {
  NormalizedBillingEvent,
  StripeCustomerMapping,
  ReconciliationSummary,
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
 */
export function matchStripeCustomer(
  stripeCustomer: { id: string; email?: string | null; name?: string | null },
  existingProfiles: Array<{ id: string; email: string; clientName?: string; stripeCustomerId?: string | null }>
): StripeCustomerMapping {
  // 1. Direct stripeCustomerId match
  const directMatch = existingProfiles.find(
    (p) => p.stripeCustomerId && p.stripeCustomerId === stripeCustomer.id
  );
  if (directMatch) {
    return {
      stripeCustomerId: stripeCustomer.id,
      clientProfileId: directMatch.id,
      email: directMatch.email,
      clientName: directMatch.clientName || directMatch.email,
      isMatched: true,
      matchStrategy: "direct_stripe_id",
    };
  }

  // 2. Email match
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
      };
    }
  }

  // 3. Unmatched customer
  return {
    stripeCustomerId: stripeCustomer.id,
    clientProfileId: null,
    email: customerEmail || "unknown@stripe-customer.com",
    clientName: stripeCustomer.name || "Unknown Customer",
    isMatched: false,
    matchStrategy: "unmatched",
  };
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
 * Compiles an authoritative financial reconciliation summary.
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
  // Formula: Invoiced = Collections Allocated + Remaining Due (for open period)
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

  const reconciliationStatus = discrepancies.length === 0 ? "balanced" : "reconciliation_pending";

  return {
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
