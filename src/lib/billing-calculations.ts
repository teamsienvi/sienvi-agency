/**
 * SIENVI AGENCY: FINANCIAL CALCULATION & ALLOCATION UTILITIES
 * Pure, deterministic mathematical functions enforcing integer-cents arithmetic,
 * multi-currency protection, and zero floating-point drift.
 */

import type {
  BillingInvoice,
  BillingPayment,
  BillingAdjustment,
  PaymentAllocationInput,
  AuthoritativeFinancialMetrics,
} from "../types/billing-subledger.ts";

/**
 * Asserts all items in a financial list share the exact same currency code.
 * Throws a deterministic Error if mixed currencies are detected without an explicit conversion policy.
 */
export function assertUniformCurrency(
  items: Array<{ currency: string }>,
  targetCurrency: string = "usd"
): void {
  const target = targetCurrency.toLowerCase();
  for (const item of items) {
    if (item.currency.toLowerCase() !== target) {
      throw new Error(
        `Multi-currency violation: Found ${item.currency} in a ${target} aggregate batch without an authorized exchange rate.`
      );
    }
  }
}

/**
 * Validates a payment allocation batch before database execution.
 * Enforces:
 * 1. Strictly positive allocations.
 * 2. Total allocated <= gross payment.
 * 3. Currency match between payment and each invoice.
 * 4. Allocation cannot exceed remaining amount due on invoice.
 */
export function validatePaymentAllocation(
  payment: { grossAmountCents: number; currency: string },
  invoices: BillingInvoice[],
  allocations: PaymentAllocationInput[]
): {
  isValid: boolean;
  totalAllocatedCents: number;
  unallocatedCents: number;
  errors: string[];
} {
  const errors: string[] = [];
  const invoiceMap = new Map(invoices.map((inv) => [inv.id, inv]));
  let totalAllocatedCents = 0;

  for (const alloc of allocations) {
    if (alloc.amount_cents <= 0) {
      errors.push(`Allocation for invoice ${alloc.invoice_id} must be strictly positive.`);
      continue;
    }

    const inv = invoiceMap.get(alloc.invoice_id);
    if (!inv) {
      errors.push(`Target invoice ${alloc.invoice_id} does not exist in target set.`);
      continue;
    }

    if (inv.currency.toLowerCase() !== payment.currency.toLowerCase()) {
      errors.push(
        `Currency mismatch: Invoice ${inv.invoiceNumber} uses ${inv.currency}, payment uses ${payment.currency}.`
      );
    }

    if (alloc.amount_cents > inv.amountDueCents) {
      errors.push(
        `Over-allocation: Attempted to allocate ${alloc.amount_cents} cents to invoice ${inv.invoiceNumber}, but only ${inv.amountDueCents} cents are due.`
      );
    }

    totalAllocatedCents += alloc.amount_cents;
  }

  if (totalAllocatedCents > payment.grossAmountCents) {
    errors.push(
      `Total allocations (${totalAllocatedCents} cents) exceed gross payment amount (${payment.grossAmountCents} cents).`
    );
  }

  const unallocatedCents = payment.grossAmountCents - totalAllocatedCents;

  return {
    isValid: errors.length === 0,
    totalAllocatedCents,
    unallocatedCents,
    errors,
  };
}

/**
 * Computes Gross Customer Collections (Total cash received from clients).
 */
export function calculateGrossCollections(
  payments: BillingPayment[],
  currency: string = "usd"
): number {
  const eligible = payments.filter(
    (p) => p.status === "succeeded" && p.currency.toLowerCase() === currency.toLowerCase()
  );
  return eligible.reduce((acc, p) => acc + p.grossAmountCents, 0);
}

/**
 * Computes Refund-Adjusted Customer Collections.
 * Gross cash collections minus total customer refunds and chargeback losses.
 */
export function calculateRefundAdjustedCollections(
  payments: BillingPayment[],
  adjustments: BillingAdjustment[],
  currency: string = "usd"
): number {
  const gross = calculateGrossCollections(payments, currency);
  const eligibleAdjustments = adjustments.filter(
    (a) =>
      (a.adjustmentType === "refund" || a.adjustmentType === "dispute_deduction") &&
      (a.currency || "usd").toLowerCase() === currency.toLowerCase()
  );
  const totalDeductions = eligibleAdjustments.reduce((acc, a) => acc + a.amountCents, 0);
  return Math.max(0, gross - totalDeductions);
}

/**
 * Computes Current Receivables (Open or partially paid invoices not yet past due).
 */
export function calculateCurrentReceivables(
  invoices: BillingInvoice[],
  now: Date = new Date(),
  currency: string = "usd"
): number {
  const eligible = invoices.filter(
    (inv) =>
      (inv.status === "open" || inv.status === "partially_paid") &&
      new Date(inv.dueDate).getTime() >= now.getTime() &&
      inv.currency.toLowerCase() === currency.toLowerCase()
  );
  return eligible.reduce((acc, inv) => acc + inv.amountDueCents, 0);
}

/**
 * Computes Past-Due Receivables (Open or partially paid invoices strictly past their due date).
 */
export function calculatePastDueReceivables(
  invoices: BillingInvoice[],
  now: Date = new Date(),
  currency: string = "usd"
): number {
  const overdueInvoices = invoices.filter(
    (inv) =>
      (inv.status === "past_due" ||
        ((inv.status === "open" || inv.status === "partially_paid") &&
          new Date(inv.dueDate).getTime() < now.getTime())) &&
      inv.currency.toLowerCase() === currency.toLowerCase()
  );
  return overdueInvoices.reduce((acc, inv) => acc + inv.amountDueCents, 0);
}

/**
 * Computes Total Outstanding Receivables.
 * Invariant: Total Outstanding = Current Receivables + Past-Due Receivables.
 * Overdue balances MUST remain included in total outstanding.
 */
export function calculateTotalOutstandingReceivables(
  invoices: BillingInvoice[],
  now: Date = new Date(),
  currency: string = "usd"
): number {
  return calculateCurrentReceivables(invoices, now, currency) + calculatePastDueReceivables(invoices, now, currency);
}

/**
 * Backward compatibility alias for calculateCurrentReceivables.
 * Note: For complete balance sheet receivables, calculateTotalOutstandingReceivables must be used.
 */
export function calculateOutstandingReceivables(
  invoices: BillingInvoice[],
  now: Date = new Date(),
  currency: string = "usd"
): number {
  return calculateCurrentReceivables(invoices, now, currency);
}

/**
 * Backward compatibility alias for calculatePastDueReceivables.
 */
export function calculatePastDueBalances(
  invoices: BillingInvoice[],
  now: Date = new Date(),
  currency: string = "usd"
): number {
  return calculatePastDueReceivables(invoices, now, currency);
}

/**
 * Computes Unapplied Customer Credits (Overpayments residing on customer accounts).
 */
export function calculateUnappliedCredits(
  payments: BillingPayment[],
  currency: string = "usd"
): number {
  const eligible = payments.filter(
    (p) => p.status === "succeeded" && p.currency.toLowerCase() === currency.toLowerCase()
  );
  return eligible.reduce((acc, p) => acc + p.unallocatedAmountCents, 0);
}
