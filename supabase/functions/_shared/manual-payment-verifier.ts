import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logAdminAudit } from "./audit-logger.ts";

export interface MatchedInvoiceAllocation {
  invoiceId: string;
  amountCents: number;
}

export interface VerifyManualPaymentParams {
  clientId: string;
  subscriptionId?: string | null;
  verifiedAmountCents: number;
  clearedBankRef: string;
  clearedDate?: string | null;
  currency?: string;
  idempotencyKey?: string | null;
  matchedInvoiceIds?: MatchedInvoiceAllocation[] | null;
  notes?: string | null;
  adminUserId: string;
  adminEmail: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface VerifyManualPaymentResult {
  success: boolean;
  idempotentDuplicate?: boolean;
  status: "verified" | "error";
  clientProfileId: string;
  subscriptionId: string | null;
  subledgerPaymentId: string | null;
  verifiedAmountCents: number;
  allocatedAmountCents: number;
  unallocatedAmountCents: number;
  currency: string;
  bankReference: string;
  idempotencyKey: string;
  message: string;
}

/**
 * Authoritative, single-source manual payment verification engine.
 * Consolidated across get-admin-billing-overview, update-client-status,
 * and the dedicated verify-manual-payment edge function.
 */
export async function executeManualPaymentVerification(
  supabaseAdmin: SupabaseClient,
  params: VerifyManualPaymentParams
): Promise<VerifyManualPaymentResult> {
  const {
    clientId,
    subscriptionId,
    verifiedAmountCents,
    clearedBankRef,
    clearedDate,
    currency = "usd",
    idempotencyKey: clientProvidedIdempKey,
    matchedInvoiceIds,
    notes,
    adminUserId,
    adminEmail,
    ipAddress,
    userAgent,
  } = params;

  // 0. Canary Server-Side Release Gate (Gate F: Financial Mutation Lock)
  // In the read-only canary release, financial mutations and manual payment verifications are locked server-side.
  const isMutationGateOpen =
    (typeof Deno !== "undefined" && Deno.env?.get?.("FEATURE_FINANCIAL_MUTATIONS_ENABLED") === "true") ||
    (typeof process !== "undefined" && process.env?.FEATURE_FINANCIAL_MUTATIONS_ENABLED === "true");

  if (!isMutationGateOpen) {
    throw new Error(
      "CANARY RELEASE GATE: Financial mutations and manual payment verifications are locked in read-only canary mode (Gate F). Set FEATURE_FINANCIAL_MUTATIONS_ENABLED=true to authorize write operations."
    );
  }

  // 1. Strict Administrator & Input Validation
  if (!adminUserId || typeof adminUserId !== "string") {
    throw new Error("Administrator identity required for financial verification");
  }

  if (!clientId || typeof clientId !== "string") {
    throw new Error("Client ID is required");
  }

  const amountCents = Number(verifiedAmountCents);
  if (!amountCents || amountCents <= 0 || !Number.isInteger(amountCents)) {
    throw new Error("Verified amount must be a positive integer in minor units (cents)");
  }

  const bankRef = typeof clearedBankRef === "string" ? clearedBankRef.trim() : "";
  if (!bankRef || bankRef.length < 3 || bankRef.length > 100) {
    throw new Error("A valid bank reference or wire confirmation number is required (3 to 100 characters)");
  }

  const effectiveCurrency = (currency || "usd").toLowerCase().trim();
  if (effectiveCurrency.length !== 3) {
    throw new Error("Currency must be a 3-character code (e.g. usd)");
  }

  // Derive stable, deterministic idempotency key if not explicitly supplied
  const effectiveIdempotencyKey =
    clientProvidedIdempKey?.trim() ||
    `idemp_mpv_${clientId}_${bankRef.replace(/[^a-zA-Z0-9]/g, "_")}_${amountCents}`;

  // 2. Fetch Client Profile & Verify Ownership
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("client_profiles")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (profileErr || !profile) {
    throw new Error("Client profile not found");
  }

  // 3. Verify Target Subscription Eligibility & Ownership
  let targetSubRecord: any = null;
  if (subscriptionId) {
    const { data: targetSub, error: targetSubErr } = await supabaseAdmin
      .from("client_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (targetSubErr || !targetSub) {
      throw new Error(`Target subscription line ${subscriptionId} not found`);
    }

    if (targetSub.client_profile_id !== clientId) {
      throw new Error(`Target subscription line does not belong to client ${clientId}`);
    }
    targetSubRecord = targetSub;
  }

  // 4. Verify Matched Invoices Ownership and Currency
  let totalAllocatedCents = 0;
  if (matchedInvoiceIds && Array.isArray(matchedInvoiceIds) && matchedInvoiceIds.length > 0) {
    for (const alloc of matchedInvoiceIds) {
      if (!alloc.amountCents || alloc.amountCents <= 0 || !Number.isInteger(alloc.amountCents)) {
        throw new Error(`Invalid invoice allocation amount for ${alloc.invoiceId}: must be positive integer cents`);
      }
      totalAllocatedCents += alloc.amountCents;
    }

    if (totalAllocatedCents > amountCents) {
      throw new Error(
        `Total invoice allocations (${totalAllocatedCents} cents) cannot exceed verified payment amount (${amountCents} cents)`
      );
    }

    const invIds = matchedInvoiceIds.map((a) => a.invoiceId);
    const { data: dbInvoices, error: invErr } = await supabaseAdmin
      .from("billing_invoices")
      .select("id, client_profile_id, currency, amount_due_cents, status")
      .in("id", invIds);

    if (!invErr && dbInvoices && dbInvoices.length > 0) {
      for (const dbInv of dbInvoices) {
        if (dbInv.client_profile_id !== clientId) {
          throw new Error(`Invoice ownership violation: invoice ${dbInv.id} does not belong to client ${clientId}`);
        }
        if (dbInv.currency.toLowerCase() !== effectiveCurrency) {
          throw new Error(
            `Currency mismatch: invoice ${dbInv.id} is ${dbInv.currency}, payment is ${effectiveCurrency}`
          );
        }
      }
    }
  } else {
    // If no explicit invoice allocations, allocate to full payment if matching subscription
    totalAllocatedCents = amountCents;
  }

  const unallocatedAmountCents = Math.max(0, amountCents - totalAllocatedCents);

  // 5. Duplicate Bank Reference Detection & Safe Retry Idempotency
  const existingConf = profile.contract_details?.bankTransferConfirmation;
  if (
    existingConf &&
    existingConf.status === "verified" &&
    existingConf.clearedBankRef?.toLowerCase() === bankRef.toLowerCase()
  ) {
    // Return idempotent success to guarantee safe retries without double-crediting
    return {
      success: true,
      idempotentDuplicate: true,
      status: "verified",
      clientProfileId: clientId,
      subscriptionId: subscriptionId || null,
      subledgerPaymentId: null,
      verifiedAmountCents: amountCents,
      allocatedAmountCents: totalAllocatedCents,
      unallocatedAmountCents,
      currency: effectiveCurrency,
      bankReference: bankRef,
      idempotencyKey: effectiveIdempotencyKey,
      message: "Payment with this bank reference number has already been verified (idempotent replay).",
    };
  }

  const verificationTimestamp = new Date().toISOString();
  const effectiveClearedDate = clearedDate || verificationTimestamp.substring(0, 10);

  // 6. Update Client Profile with Verified Evidence
  const updatedTransferConfirmation = {
    ...(existingConf || {}),
    status: "verified",
    verifiedAt: verificationTimestamp,
    verifiedBy: adminUserId,
    verifiedAmountCents: amountCents,
    clearedBankRef: bankRef,
    clearedDate: effectiveClearedDate,
    currency: effectiveCurrency,
    idempotencyKey: effectiveIdempotencyKey,
    notes: notes || existingConf?.notes || "",
  };

  const updatedContractDetails = {
    ...(profile.contract_details || {}),
    bankTransferConfirmation: updatedTransferConfirmation,
  };

  const { error: profileUpdateErr } = await supabaseAdmin
    .from("client_profiles")
    .update({
      contract_details: updatedContractDetails,
      subscription_status: "active",
      account_status: "active",
      updated_at: verificationTimestamp,
    })
    .eq("id", clientId);

  if (profileUpdateErr) {
    throw new Error(`Failed to update client profile: ${profileUpdateErr.message}`);
  }

  // 7. Line-Item Isolation: Activate ONLY the target subscription line
  if (subscriptionId) {
    const { data: subData, error: subErr } = await supabaseAdmin
      .from("client_subscriptions")
      .update({
        subscription_status: "active",
        updated_at: verificationTimestamp,
      })
      .eq("id", subscriptionId)
      .eq("client_profile_id", clientId)
      .select()
      .maybeSingle();

    if (subErr) {
      console.error("[Manual Payment Verifier] Error activating target subscription:", subErr);
    } else {
      targetSubRecord = subData;
    }
  } else {
    // If no explicit subscriptionId, activate only the first pending subscription line
    const { data: pendingSubs } = await supabaseAdmin
      .from("client_subscriptions")
      .select("id")
      .eq("client_profile_id", clientId)
      .eq("subscription_status", "pending_payment")
      .limit(1);

    if (pendingSubs && pendingSubs.length > 0) {
      const { data: subData } = await supabaseAdmin
        .from("client_subscriptions")
        .update({
          subscription_status: "active",
          updated_at: verificationTimestamp,
        })
        .eq("id", pendingSubs[0].id)
        .select()
        .maybeSingle();
      targetSubRecord = subData;
    }
  }

  // 8. Subledger Ledger Commit (if feature flag is enabled in isolated test environment)
  let subledgerPaymentId: string | null = null;
  const isSubledgerEnabled = Deno.env.get("FEATURE_BILLING_SUBLEDGER_ENABLED") === "true";
  if (isSubledgerEnabled) {
    try {
      const { data: paymentRow, error: paymentErr } = await supabaseAdmin
        .from("billing_payments")
        .insert([{
          client_profile_id: clientId,
          payment_channel: "ach",
          status: "succeeded",
          gross_amount_cents: amountCents,
          fee_amount_cents: 0,
          net_amount_cents: amountCents,
          allocated_amount_cents: totalAllocatedCents,
          currency: effectiveCurrency,
          bank_reference_number: bankRef,
          settled_at: verificationTimestamp,
          reconciled: true,
          reconciled_at: verificationTimestamp,
          reconciled_by: adminUserId,
          notes: notes || `Verified by admin ${adminEmail} (Idemp: ${effectiveIdempotencyKey})`,
        }])
        .select("id")
        .maybeSingle();

      if (!paymentErr && paymentRow) {
        subledgerPaymentId = paymentRow.id;
      }
    } catch (ledgerErr) {
      console.warn("[Manual Payment Verifier] Subledger write skipped:", ledgerErr);
    }
  }

  // 9. Durable Financial Audit Log
  await logAdminAudit(supabaseAdmin, {
    adminUserId,
    action: "manual_payment_verified",
    category: "financial",
    targetClientId: clientId,
    metadata: {
      verifiedAmountCents: amountCents,
      allocatedAmountCents: totalAllocatedCents,
      unallocatedAmountCents,
      currency: effectiveCurrency,
      bankReference: bankRef,
      clearedDate: effectiveClearedDate,
      idempotencyKey: effectiveIdempotencyKey,
      subscriptionId: targetSubRecord?.id || subscriptionId || null,
      subledgerPaymentId,
      matchedInvoiceCount: Array.isArray(matchedInvoiceIds) ? matchedInvoiceIds.length : 0,
    },
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  return {
    success: true,
    status: "verified",
    clientProfileId: clientId,
    subscriptionId: targetSubRecord?.id || subscriptionId || null,
    subledgerPaymentId,
    verifiedAmountCents: amountCents,
    allocatedAmountCents: totalAllocatedCents,
    unallocatedAmountCents,
    currency: effectiveCurrency,
    bankReference: bankRef,
    idempotencyKey: effectiveIdempotencyKey,
    message: "Manual payment verified successfully and applied to account.",
  };
}
