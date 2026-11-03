import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export interface NormalizedBillingEvent {
  sourceSystem: "stripe";
  stripeAccountId: string | null;
  livemode: boolean;
  externalObjectId: string; // e.g. ch_..., in_..., re_..., dp_..., po_...
  eventId: string | null; // e.g. evt_...
  eventType: string;
  customerReference: string | null;
  invoiceReference: string | null;
  paymentReference: string | null;
  amountCents: number;
  feeAmountCents: number;
  netAmountCents: number;
  currency: string;
  sourceStatus: string;
  sourceCreatedAt: string;
  sourceSettledAt: string | null;
  ingestionTimestamp: string;
  processingStatus: "staged" | "processed" | "skipped_duplicate" | "flagged_unmapped" | "rejected_stale" | "failed";
  idempotencyKey: string;
  isPayout?: boolean;
  statePrecedence: number;
  metadata: Record<string, unknown>;
}

export const INVOICE_STATE_PRECEDENCE: Record<string, number> = {
  draft: 1,
  open: 2,
  uncollectible: 3,
  void: 4,
  paid: 5,
};

export const CHARGE_STATE_PRECEDENCE: Record<string, number> = {
  failed: 1,
  pending: 2,
  succeeded: 3,
  refunded: 4,
};

export const REFUND_STATE_PRECEDENCE: Record<string, number> = {
  pending: 1,
  succeeded: 2,
  failed: 3,
  canceled: 4,
};

export const DISPUTE_STATE_PRECEDENCE: Record<string, number> = {
  needs_response: 1,
  under_review: 2,
  warning_closed: 3,
  won: 4,
  lost: 5,
};

export const PAYOUT_STATE_PRECEDENCE: Record<string, number> = {
  pending: 1,
  in_transit: 2,
  paid: 3,
  failed: 4,
  canceled: 5,
};

export function generateIdempotencyKey(
  objectType: string,
  objectId: string,
  status: string = "default",
  stripeAccountId: string | null = null,
  eventId: string | null = null
): string {
  const accountPrefix = stripeAccountId ? stripeAccountId.trim() : "primary";
  if (eventId && eventId.startsWith("evt_")) {
    return `stripe:${accountPrefix}:evt:${eventId.trim()}`;
  }
  return `stripe:${accountPrefix}:${objectType.toLowerCase()}:${objectId.trim()}:${status.toLowerCase()}`;
}

export function canTransitionState(
  currentPrecedence: number,
  incomingPrecedence: number,
  currentTimestamp?: string | null,
  incomingTimestamp?: string | null
): { allowed: boolean; reason: string } {
  if (incomingPrecedence < currentPrecedence) {
    return {
      allowed: false,
      reason: `Stale event rejected: incoming state precedence (${incomingPrecedence}) is lower than existing state precedence (${currentPrecedence}).`,
    };
  }
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
 * Normalizes raw Stripe objects into a unified NormalizedBillingEvent.
 */
export function normalizeStripeWebhookEvent(
  rawEvent: any,
  stripeAccountId: string | null = null
): NormalizedBillingEvent | null {
  const eventId = rawEvent.id;
  const eventType = rawEvent.type;
  const obj = rawEvent.data?.object;
  if (!obj) return null;

  const livemode = rawEvent.livemode !== undefined ? Boolean(rawEvent.livemode) : true;

  if (eventType.startsWith("invoice.")) {
    const status = (obj.status || "open").toLowerCase();
    const amountCents = Math.round(Number(obj.total || 0));
    const currency = String(obj.currency || "usd").toLowerCase();
    const sourceCreatedAt = obj.created ? new Date(obj.created * 1000).toISOString() : new Date().toISOString();
    const sourceSettledAt = obj.status_transitions?.paid_at
      ? new Date(obj.status_transitions.paid_at * 1000).toISOString()
      : null;

    return {
      sourceSystem: "stripe",
      stripeAccountId,
      livemode,
      externalObjectId: obj.id,
      eventId,
      eventType,
      customerReference: typeof obj.customer === "string" ? obj.customer : obj.customer?.id || null,
      invoiceReference: obj.id,
      paymentReference: typeof obj.charge === "string" ? obj.charge : obj.payment_intent || null,
      amountCents,
      feeAmountCents: 0,
      netAmountCents: amountCents,
      currency,
      sourceStatus: status,
      sourceCreatedAt,
      sourceSettledAt,
      ingestionTimestamp: new Date().toISOString(),
      processingStatus: "staged",
      idempotencyKey: generateIdempotencyKey("invoice", obj.id, status, stripeAccountId, eventId),
      statePrecedence: INVOICE_STATE_PRECEDENCE[status] || 1,
      metadata: {
        number: obj.number,
        subscriptionId: obj.subscription,
        attemptCount: obj.attempt_count,
        billingReason: obj.billing_reason,
      },
    };
  }

  if (eventType.startsWith("charge.") || eventType.startsWith("payment_intent.")) {
    const status = (obj.status || "succeeded").toLowerCase();
    const amountCents = Math.round(Number(obj.amount || 0));
    const currency = String(obj.currency || "usd").toLowerCase();
    let feeAmountCents = 0;
    if (obj.balance_transaction && typeof obj.balance_transaction === "object") {
      feeAmountCents = Math.round(Number(obj.balance_transaction.fee || 0));
    }
    const netAmountCents = Math.max(0, amountCents - feeAmountCents);
    const sourceCreatedAt = obj.created ? new Date(obj.created * 1000).toISOString() : new Date().toISOString();

    return {
      sourceSystem: "stripe",
      stripeAccountId,
      livemode,
      externalObjectId: obj.id,
      eventId,
      eventType,
      customerReference: typeof obj.customer === "string" ? obj.customer : obj.customer?.id || null,
      invoiceReference: typeof obj.invoice === "string" ? obj.invoice : obj.invoice?.id || null,
      paymentReference: obj.payment_intent || obj.id,
      amountCents,
      feeAmountCents,
      netAmountCents,
      currency,
      sourceStatus: status,
      sourceCreatedAt,
      sourceSettledAt: obj.paid ? sourceCreatedAt : null,
      ingestionTimestamp: new Date().toISOString(),
      processingStatus: "staged",
      idempotencyKey: generateIdempotencyKey("charge", obj.id, status, stripeAccountId, eventId),
      statePrecedence: CHARGE_STATE_PRECEDENCE[status] || 1,
      metadata: {
        paymentMethodType: obj.payment_method_details?.type,
        receiptUrl: obj.receipt_url,
      },
    };
  }

  if (eventType.startsWith("refund.") || eventType === "charge.refund.updated") {
    const status = (obj.status || "succeeded").toLowerCase();
    const amountCents = Math.round(Number(obj.amount || 0));
    const currency = String(obj.currency || "usd").toLowerCase();
    const sourceCreatedAt = obj.created ? new Date(obj.created * 1000).toISOString() : new Date().toISOString();

    return {
      sourceSystem: "stripe",
      stripeAccountId,
      livemode,
      externalObjectId: obj.id,
      eventId,
      eventType: "refund.created",
      customerReference: null,
      invoiceReference: null,
      paymentReference: typeof obj.charge === "string" ? obj.charge : obj.charge?.id || null,
      amountCents,
      feeAmountCents: 0,
      netAmountCents: amountCents,
      currency,
      sourceStatus: status,
      sourceCreatedAt,
      sourceSettledAt: sourceCreatedAt,
      ingestionTimestamp: new Date().toISOString(),
      processingStatus: "staged",
      idempotencyKey: generateIdempotencyKey("refund", obj.id, status, stripeAccountId, eventId),
      statePrecedence: REFUND_STATE_PRECEDENCE[status] || 1,
      metadata: {
        reason: obj.reason,
        parentChargeId: typeof obj.charge === "string" ? obj.charge : obj.charge?.id,
      },
    };
  }

  if (eventType.startsWith("dispute.") || eventType.startsWith("charge.dispute.")) {
    const status = (obj.status || "needs_response").toLowerCase();
    const isClosed = status === "won" || status === "lost";
    const amountCents = Math.round(Number(obj.amount || 0));
    const currency = String(obj.currency || "usd").toLowerCase();
    const sourceCreatedAt = obj.created ? new Date(obj.created * 1000).toISOString() : new Date().toISOString();

    return {
      sourceSystem: "stripe",
      stripeAccountId,
      livemode,
      externalObjectId: obj.id,
      eventId,
      eventType: isClosed ? "dispute.closed" : "dispute.created",
      customerReference: null,
      invoiceReference: null,
      paymentReference: typeof obj.charge === "string" ? obj.charge : obj.charge?.id || null,
      amountCents,
      feeAmountCents: 1500,
      netAmountCents: amountCents,
      currency,
      sourceStatus: status,
      sourceCreatedAt,
      sourceSettledAt: isClosed ? new Date().toISOString() : null,
      ingestionTimestamp: new Date().toISOString(),
      processingStatus: "staged",
      idempotencyKey: generateIdempotencyKey("dispute", obj.id, status, stripeAccountId, eventId),
      statePrecedence: DISPUTE_STATE_PRECEDENCE[status] || 1,
      metadata: {
        reason: obj.reason,
        parentChargeId: typeof obj.charge === "string" ? obj.charge : obj.charge?.id,
      },
    };
  }

  if (eventType.startsWith("payout.")) {
    const status = (obj.status || "paid").toLowerCase();
    const amountCents = Math.round(Number(obj.amount || 0));
    const currency = String(obj.currency || "usd").toLowerCase();
    const sourceCreatedAt = obj.created ? new Date(obj.created * 1000).toISOString() : new Date().toISOString();
    const sourceSettledAt = obj.arrival_date ? new Date(obj.arrival_date * 1000).toISOString() : null;

    return {
      sourceSystem: "stripe",
      stripeAccountId,
      livemode,
      externalObjectId: obj.id,
      eventId,
      eventType: "payout.paid",
      customerReference: null,
      invoiceReference: null,
      paymentReference: null,
      amountCents,
      feeAmountCents: 0,
      netAmountCents: amountCents,
      currency,
      sourceStatus: status,
      sourceCreatedAt,
      sourceSettledAt,
      ingestionTimestamp: new Date().toISOString(),
      processingStatus: "staged",
      idempotencyKey: generateIdempotencyKey("payout", obj.id, status, stripeAccountId, eventId),
      isPayout: true, // Non-revenue invariant flag
      statePrecedence: PAYOUT_STATE_PRECEDENCE[status] || 1,
      metadata: {
        destination: obj.destination,
        type: obj.type,
      },
    };
  }

  return null;
}

/**
 * Ingests a normalized event into the operational billing subledger if enabled.
 * Strictly checks idempotency, RLS, client mapping, and state precedence.
 */
export async function ingestEventIntoSubledger(
  supabaseAdmin: SupabaseClient,
  event: NormalizedBillingEvent
): Promise<{ status: "ingested" | "idempotent_duplicate" | "flagged_unmapped" | "stale_ignored" | "feature_disabled"; message?: string }> {
  // Check if subledger feature toggle is enabled (Gate E)
  const isSubledgerEnabled =
    (typeof Deno !== "undefined" && Deno.env?.get?.("FEATURE_BILLING_SUBLEDGER_ENABLED") === "true") ||
    (typeof process !== "undefined" && process.env?.FEATURE_BILLING_SUBLEDGER_ENABLED === "true");
  if (!isSubledgerEnabled) {
    return { status: "feature_disabled", message: "Billing subledger ingestion feature flag is not enabled." };
  }

  try {
    // 1. Authoritative Domain Entity Idempotency & Precedence Check
    if (event.isPayout) {
      const { data: existingPayout } = await supabaseAdmin
        .from("billing_payouts")
        .select("id, status")
        .eq("stripe_payout_id", event.externalObjectId)
        .maybeSingle();

      if (existingPayout && existingPayout.status === event.sourceStatus) {
        return { status: "idempotent_duplicate", message: `Payout ${event.externalObjectId} already recorded with status ${existingPayout.status}.` };
      }
    } else if (event.eventType.startsWith("invoice.")) {
      const { data: existingInvoice } = await supabaseAdmin
        .from("billing_invoices")
        .select("id, status")
        .eq("stripe_invoice_id", event.externalObjectId)
        .maybeSingle();

      if (existingInvoice) {
        const existingPrecedence = INVOICE_STATE_PRECEDENCE[existingInvoice.status] || 1;
        const incomingPrecedence = event.statePrecedence;
        if (incomingPrecedence < existingPrecedence) {
          return { status: "stale_ignored", message: `Stale invoice event rejected: current=${existingInvoice.status}, incoming=${event.sourceStatus}` };
        }
        if (existingInvoice.status === event.sourceStatus) {
          return { status: "idempotent_duplicate", message: `Invoice ${event.externalObjectId} already processed in state ${existingInvoice.status}.` };
        }
      }
    } else if (event.eventType.startsWith("charge.") || event.eventType.startsWith("payment_intent.")) {
      const { data: existingPayment } = await supabaseAdmin
        .from("billing_payments")
        .select("id, status")
        .eq("stripe_charge_id", event.externalObjectId)
        .maybeSingle();

      if (existingPayment) {
        const existingPrecedence = CHARGE_STATE_PRECEDENCE[existingPayment.status] || 1;
        const incomingPrecedence = event.statePrecedence;
        if (incomingPrecedence < existingPrecedence) {
          return { status: "stale_ignored", message: `Stale charge event rejected: current=${existingPayment.status}, incoming=${event.sourceStatus}` };
        }
        if (existingPayment.status === event.sourceStatus) {
          return { status: "idempotent_duplicate", message: `Payment ${event.externalObjectId} already recorded in state ${existingPayment.status}.` };
        }
      }
    } else if (event.eventType.startsWith("refund.") || event.eventType.startsWith("dispute.")) {
      const isDispute = event.eventType.startsWith("dispute.");
      const column = isDispute ? "stripe_dispute_id" : "stripe_refund_id";
      const { data: existingAdj } = await supabaseAdmin
        .from("billing_adjustments")
        .select("id")
        .eq(column, event.externalObjectId)
        .maybeSingle();

      if (existingAdj) {
        return { status: "idempotent_duplicate", message: `Adjustment ${event.externalObjectId} already recorded.` };
      }
    }

    // 2. Client Profile Resolution
    let clientProfileId: string | null = null;
    if (event.customerReference) {
      const { data: profile } = await supabaseAdmin
        .from("client_profiles")
        .select("id")
        .eq("stripe_customer_id", event.customerReference)
        .maybeSingle();
      if (profile) {
        clientProfileId = profile.id;
      }
    }

    // 4. Update Domain Entities
    if (event.isPayout) {
      await supabaseAdmin.from("billing_payouts").upsert({
        stripe_payout_id: event.externalObjectId,
        stripe_account_id: event.stripeAccountId,
        amount_cents: event.amountCents,
        currency: event.currency,
        status: event.sourceStatus,
        arrival_date: (event.sourceSettledAt || event.sourceCreatedAt).substring(0, 10),
      }, { onConflict: "stripe_payout_id" });
    } else if (event.eventType.startsWith("invoice.")) {
      await supabaseAdmin.from("billing_invoices").upsert({
        stripe_invoice_id: event.externalObjectId,
        client_profile_id: clientProfileId,
        invoice_number: String(event.metadata.number || event.externalObjectId),
        invoice_type: "recurring_subscription",
        billing_channel: "stripe",
        status: event.sourceStatus === "paid" ? "paid" : (event.sourceStatus === "open" ? "open" : "draft"),
        subtotal_amount_cents: event.amountCents,
        tax_amount_cents: 0,
        total_amount_cents: event.amountCents,
        amount_paid_cents: event.sourceStatus === "paid" ? event.amountCents : 0,
        amount_due_cents: event.sourceStatus === "paid" ? 0 : event.amountCents,
        currency: event.currency,
        due_date: event.sourceCreatedAt,
        issued_at: event.sourceCreatedAt,
        paid_at: event.sourceSettledAt,
        metadata: event.metadata,
      }, { onConflict: "stripe_invoice_id" });
    } else if (event.eventType.startsWith("charge.") || event.eventType.startsWith("payment_intent.")) {
      await supabaseAdmin.from("billing_payments").upsert({
        stripe_charge_id: event.externalObjectId,
        client_profile_id: clientProfileId,
        payment_channel: "stripe",
        status: event.sourceStatus === "succeeded" ? "succeeded" : "failed",
        gross_amount_cents: event.amountCents,
        fee_amount_cents: event.feeAmountCents,
        net_amount_cents: event.netAmountCents,
        currency: event.currency,
        settled_at: event.sourceSettledAt || event.sourceCreatedAt,
        reconciled: Boolean(clientProfileId),
        reconciled_at: clientProfileId ? new Date().toISOString() : null,
        metadata: event.metadata,
      }, { onConflict: "stripe_charge_id" });
    } else if (event.eventType.startsWith("refund.") || event.eventType.startsWith("dispute.")) {
      const isDispute = event.eventType.startsWith("dispute.");
      await supabaseAdmin.from("billing_adjustments").upsert({
        client_profile_id: clientProfileId,
        adjustment_type: isDispute ? "dispute_deduction" : "refund",
        amount_cents: event.amountCents,
        currency: event.currency,
        stripe_refund_id: isDispute ? null : event.externalObjectId,
        stripe_dispute_id: isDispute ? event.externalObjectId : null,
        reason: String(event.metadata.reason || (isDispute ? "Stripe dispute" : "Customer refund")),
        adjusted_at: event.sourceCreatedAt,
      }, { onConflict: isDispute ? "stripe_dispute_id" : "stripe_refund_id" });
    }

    // 5. Flag Unmapped Customers in Billing Exceptions Queue
    if (!clientProfileId && !event.isPayout) {
      await supabaseAdmin.from("billing_exceptions").insert([{
        exception_type: "unmatched_transaction",
        severity: "medium",
        status: "open",
        title: `Unmapped Customer Transaction: ${event.externalObjectId}`,
        description: `Stripe transaction ${event.externalObjectId} (${event.eventType}) with customer ${event.customerReference || "none"} has no matching client profile in Supabase.`,
        suggested_action: "Link Stripe Customer ID to client profile or map to manual retainer.",
        metadata: {
          eventId: event.eventId,
          externalObjectId: event.externalObjectId,
          customerReference: event.customerReference,
          amountCents: event.amountCents,
          currency: event.currency,
        },
      }]);
    }

    return { status: clientProfileId || event.isPayout ? "ingested" : "flagged_unmapped" };
  } catch (err: any) {
    console.error("[Subledger Ingestion Error]", err.message);
    return { status: "stale_ignored", message: err.message };
  }
}
