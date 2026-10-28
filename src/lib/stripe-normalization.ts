/**
 * SIENVI AGENCY: STRIPE EVENT NORMALIZATION UTILITIES
 * Pure, deterministic mathematical and object transformations converting
 * raw Stripe API objects into NormalizedBillingEvent structures.
 */

import type {
  NormalizedBillingEvent,
  NormalizedEventType,
} from "../types/stripe-ingestion.ts";

/**
 * Generates a deterministic idempotency key for an event or object.
 */
export function generateIdempotencyKey(
  objectType: string,
  objectId: string,
  status: string = "default"
): string {
  return `stripe:${objectType.toLowerCase()}:${objectId.trim()}:${status.toLowerCase()}`;
}

/**
 * Normalizes a raw Stripe Invoice object into a NormalizedBillingEvent.
 */
export function normalizeStripeInvoice(
  invoice: any,
  stripeAccountId: string | null = null,
  eventId: string | null = null
): NormalizedBillingEvent {
  const status = (invoice.status || "open").toLowerCase();
  let eventType: NormalizedEventType = "invoice.created";
  if (status === "paid") eventType = "invoice.paid";
  else if (status === "uncollectible") eventType = "invoice.marked_uncollectible";
  else if (status === "void") eventType = "invoice.voided";
  else if (invoice.attempt_count > 0 && status === "open") eventType = "invoice.payment_failed";

  const amountCents = Math.round(Number(invoice.total || 0));
  const currency = String(invoice.currency || "usd").toLowerCase();

  const sourceCreatedAt = invoice.created
    ? new Date(invoice.created * 1000).toISOString()
    : new Date().toISOString();

  const sourceSettledAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    : null;

  return {
    sourceSystem: "stripe",
    stripeAccountId,
    externalObjectId: invoice.id,
    eventId,
    eventType,
    customerReference: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || null,
    invoiceReference: invoice.id,
    paymentReference: typeof invoice.charge === "string" ? invoice.charge : invoice.payment_intent || null,
    amountCents,
    feeAmountCents: 0,
    netAmountCents: amountCents,
    currency,
    sourceStatus: status,
    sourceCreatedAt,
    sourceSettledAt,
    ingestionTimestamp: new Date().toISOString(),
    processingStatus: "staged",
    idempotencyKey: generateIdempotencyKey("invoice", invoice.id, status),
    metadata: {
      number: invoice.number,
      subscriptionId: invoice.subscription,
      attemptCount: invoice.attempt_count,
      billingReason: invoice.billing_reason,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      subtotalCents: invoice.subtotal,
      taxCents: invoice.tax || 0,
      amountPaidCents: invoice.amount_paid || 0,
      amountDueCents: invoice.amount_due || 0,
    },
  };
}

/**
 * Normalizes a raw Stripe Charge object into a NormalizedBillingEvent.
 */
export function normalizeStripeCharge(
  charge: any,
  stripeAccountId: string | null = null,
  eventId: string | null = null
): NormalizedBillingEvent {
  const status = (charge.status || "succeeded").toLowerCase();
  let eventType: NormalizedEventType = "charge.succeeded";
  if (status === "failed") eventType = "charge.failed";
  else if (charge.refunded) eventType = "charge.refunded";

  const amountCents = Math.round(Number(charge.amount || 0));
  const currency = String(charge.currency || "usd").toLowerCase();

  // Stripe balance_transaction fee calculation when expanded
  let feeAmountCents = 0;
  if (charge.balance_transaction && typeof charge.balance_transaction === "object") {
    feeAmountCents = Math.round(Number(charge.balance_transaction.fee || 0));
  }
  const netAmountCents = Math.max(0, amountCents - feeAmountCents);

  const sourceCreatedAt = charge.created
    ? new Date(charge.created * 1000).toISOString()
    : new Date().toISOString();

  return {
    sourceSystem: "stripe",
    stripeAccountId,
    externalObjectId: charge.id,
    eventId,
    eventType,
    customerReference: typeof charge.customer === "string" ? charge.customer : charge.customer?.id || null,
    invoiceReference: typeof charge.invoice === "string" ? charge.invoice : charge.invoice?.id || null,
    paymentReference: charge.payment_intent || charge.id,
    amountCents,
    feeAmountCents,
    netAmountCents,
    currency,
    sourceStatus: status,
    sourceCreatedAt,
    sourceSettledAt: charge.paid ? sourceCreatedAt : null,
    ingestionTimestamp: new Date().toISOString(),
    processingStatus: "staged",
    idempotencyKey: generateIdempotencyKey("charge", charge.id, status),
    metadata: {
      paymentMethodBrand: charge.payment_method_details?.card?.brand || charge.payment_method_details?.type,
      paymentMethodLast4: charge.payment_method_details?.card?.last4,
      balanceTransactionId: typeof charge.balance_transaction === "string" ? charge.balance_transaction : charge.balance_transaction?.id,
      receiptUrl: charge.receipt_url,
      failureCode: charge.failure_code,
      failureMessage: charge.failure_message,
    },
  };
}

/**
 * Normalizes a raw Stripe Refund object into a NormalizedBillingEvent.
 */
export function normalizeStripeRefund(
  refund: any,
  stripeAccountId: string | null = null,
  eventId: string | null = null
): NormalizedBillingEvent {
  const status = (refund.status || "succeeded").toLowerCase();
  const amountCents = Math.round(Number(refund.amount || 0));
  const currency = String(refund.currency || "usd").toLowerCase();

  const sourceCreatedAt = refund.created
    ? new Date(refund.created * 1000).toISOString()
    : new Date().toISOString();

  return {
    sourceSystem: "stripe",
    stripeAccountId,
    externalObjectId: refund.id,
    eventId,
    eventType: "refund.created",
    customerReference: null,
    invoiceReference: null,
    paymentReference: typeof refund.charge === "string" ? refund.charge : refund.charge?.id || null,
    amountCents,
    feeAmountCents: 0,
    netAmountCents: amountCents,
    currency,
    sourceStatus: status,
    sourceCreatedAt,
    sourceSettledAt: sourceCreatedAt,
    ingestionTimestamp: new Date().toISOString(),
    processingStatus: "staged",
    idempotencyKey: generateIdempotencyKey("refund", refund.id, status),
    metadata: {
      reason: refund.reason || "requested_by_customer",
      balanceTransactionId: refund.balance_transaction,
      receiptNumber: refund.receipt_number,
    },
  };
}

/**
 * Normalizes a raw Stripe Dispute object into a NormalizedBillingEvent.
 */
export function normalizeStripeDispute(
  dispute: any,
  stripeAccountId: string | null = null,
  eventId: string | null = null
): NormalizedBillingEvent {
  const status = (dispute.status || "needs_response").toLowerCase();
  const isClosed = status === "won" || status === "lost";
  const eventType: NormalizedEventType = isClosed ? "dispute.closed" : "dispute.created";

  const amountCents = Math.round(Number(dispute.amount || 0));
  const currency = String(dispute.currency || "usd").toLowerCase();

  const sourceCreatedAt = dispute.created
    ? new Date(dispute.created * 1000).toISOString()
    : new Date().toISOString();

  return {
    sourceSystem: "stripe",
    stripeAccountId,
    externalObjectId: dispute.id,
    eventId,
    eventType,
    customerReference: null,
    invoiceReference: null,
    paymentReference: typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id || null,
    amountCents,
    feeAmountCents: 1500, // Standard Stripe dispute fee ($15.00)
    netAmountCents: amountCents,
    currency,
    sourceStatus: status,
    sourceCreatedAt,
    sourceSettledAt: sourceCreatedAt,
    ingestionTimestamp: new Date().toISOString(),
    processingStatus: "staged",
    idempotencyKey: generateIdempotencyKey("dispute", dispute.id, status),
    metadata: {
      reason: dispute.reason,
      evidenceDueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      isChargeRefundable: dispute.is_charge_refundable,
    },
  };
}

/**
 * Normalizes a raw Stripe Payout object into a NormalizedBillingEvent.
 * Invariant: Payout transfers are strictly segregated and NEVER counted as customer collections.
 */
export function normalizeStripePayout(
  payout: any,
  stripeAccountId: string | null = null,
  eventId: string | null = null
): NormalizedBillingEvent {
  const status = (payout.status || "in_transit").toLowerCase();
  let eventType: NormalizedEventType = "payout.created";
  if (status === "paid") eventType = "payout.paid";
  else if (status === "failed") eventType = "payout.failed";
  else if (status === "canceled") eventType = "payout.canceled";

  const amountCents = Math.round(Number(payout.amount || 0));
  const feeCents = Math.round(Number(payout.fee || 0));
  const currency = String(payout.currency || "usd").toLowerCase();

  const sourceCreatedAt = payout.created
    ? new Date(payout.created * 1000).toISOString()
    : new Date().toISOString();

  const sourceSettledAt = payout.arrival_date
    ? new Date(payout.arrival_date * 1000).toISOString()
    : null;

  return {
    sourceSystem: "stripe",
    stripeAccountId,
    externalObjectId: payout.id,
    eventId,
    eventType,
    customerReference: null,
    invoiceReference: null,
    paymentReference: null,
    amountCents,
    feeAmountCents: feeCents,
    netAmountCents: Math.max(0, amountCents - feeCents),
    currency,
    sourceStatus: status,
    sourceCreatedAt,
    sourceSettledAt,
    ingestionTimestamp: new Date().toISOString(),
    processingStatus: "staged",
    idempotencyKey: generateIdempotencyKey("payout", payout.id, status),
    metadata: {
      isPayout: true, // Explicit flag: Bank transfer to agency operating account
      destinationBankLast4: payout.destination?.last4 || null,
      bankStatementDescriptor: payout.statement_descriptor,
      type: payout.type,
      method: payout.method,
    },
  };
}
