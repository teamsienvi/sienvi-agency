import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { withAllowedOrigin } from "../_shared/cors.ts";
import { logAdminAudit } from "../_shared/audit-logger.ts";
import { executeManualPaymentVerification } from "../_shared/manual-payment-verifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

function parsePagination(url: URL): PaginationParams {
  const pageStr = url.searchParams.get("page");
  const pageSizeStr = url.searchParams.get("pageSize") || url.searchParams.get("limit");
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeStr || "20", 10) || 20));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

serve(withAllowedOrigin(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Strict Server-Side JWT Verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Strict Server-Side Admin Authorization (RBAC)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Access denied. Administrator privileges required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);

    // =========================================================================
    // POST / ACTION HANDLER: Administrative Manual Payment Verification & Exceptions
    // =========================================================================
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const hasMutationPayload = Boolean(body && (body.action || body.clientId || body.exceptionId || body.verifiedAmountCents));
      if (hasMutationPayload && body.action !== "get_overview") {
      const action = body.action || "verify_manual_payment";

      if (action === "verify_manual_payment") {
        try {
          const result = await executeManualPaymentVerification(supabaseAdmin, {
            clientId: body.clientId,
            subscriptionId: body.subscriptionId,
            verifiedAmountCents: body.verifiedAmountCents,
            clearedBankRef: body.clearedBankRef,
            clearedDate: body.clearedDate,
            matchedInvoiceIds: body.matchedInvoiceIds,
            notes: body.notes,
            adminUserId: user.id,
            adminEmail: user.email || "admin@sienvi.com",
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
            userAgent: req.headers.get("user-agent"),
          });

          return new Response(
            JSON.stringify(result),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (verifyErr: any) {
          const status = verifyErr.message?.includes("CANARY RELEASE GATE") ? 403 : 400;
          return new Response(
            JSON.stringify({ error: verifyErr.message || "Manual payment verification failed" }),
            { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      if (action === "resolve_billing_exception") {
        const isMutationGateOpen =
          (typeof Deno !== "undefined" && Deno.env?.get?.("FEATURE_FINANCIAL_MUTATIONS_ENABLED") === "true") ||
          (typeof process !== "undefined" && process.env?.FEATURE_FINANCIAL_MUTATIONS_ENABLED === "true");

        if (!isMutationGateOpen) {
          return new Response(
            JSON.stringify({
              error: "CANARY RELEASE GATE: Financial reconciliation mutations are locked in read-only canary mode (Gate F). Set FEATURE_FINANCIAL_MUTATIONS_ENABLED=true to authorize write operations."
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { exceptionId, resolutionNotes } = body;
        if (!exceptionId) {
          return new Response(
            JSON.stringify({ error: "exceptionId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updatedEx, error: exErr } = await supabaseAdmin
          .from("billing_exceptions")
          .update({
            status: "resolved",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
            resolution_notes: resolutionNotes || "Resolved by administrator",
          })
          .eq("id", exceptionId)
          .select()
          .maybeSingle();

        if (exErr) {
          return new Response(
            JSON.stringify({ error: `Failed to resolve exception: ${exErr.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Audit Log
        await logAdminAudit(supabaseAdmin, {
          adminUserId: user.id,
          action: "billing_exception_resolved",
          category: "financial",
          metadata: {
            exceptionId,
            resolutionNotes: resolutionNotes || "",
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
          userAgent: req.headers.get("user-agent"),
        });

        return new Response(
          JSON.stringify({ success: true, exception: updatedEx }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      }
    }

    // =========================================================================
    // GET HANDLER: Typed, Paginated Financial Read API
    // =========================================================================
    const pagination = parsePagination(url);
    const statusFilter = url.searchParams.get("status");
    const clientIdFilter = url.searchParams.get("clientId");
    const searchFilter = url.searchParams.get("search")?.toLowerCase().trim();

    // Query core data tables and Phase 2B subledger tables in parallel
    const [
      { data: clientsRaw, error: clientsErr },
      { data: subscriptionsRaw, error: subsErr },
      { data: otpsRaw },
      { data: billingInvoicesRaw },
      { data: billingPaymentsRaw },
      { data: billingExceptionsRaw },
      { data: manualSubmissionsRaw },
      { data: auditLogsRaw },
    ] = await Promise.all([
      supabaseAdmin.from("client_profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("client_subscriptions").select("*").order("created_at", { ascending: true }),
      supabaseAdmin.from("client_one_time_payments").select("*").order("due_date", { ascending: true }),
      supabaseAdmin.from("billing_invoices").select("*").order("due_date", { ascending: false }),
      supabaseAdmin.from("billing_payments").select("*").order("settled_at", { ascending: false }),
      supabaseAdmin.from("billing_exceptions").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("manual_payment_submissions").select("*").order("submitted_at", { ascending: false }),
      supabaseAdmin.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    if (clientsErr || subsErr) {
      console.error("[Billing API] Fetch error:", clientsErr || subsErr);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve billing source records" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clients = clientsRaw || [];
    const subscriptions = subscriptionsRaw || [];
    const otps = otpsRaw || [];
    const billingInvoices = billingInvoicesRaw || [];
    const billingPayments = billingPaymentsRaw || [];
    const billingExceptions = billingExceptionsRaw || [];
    const manualSubmissions = manualSubmissionsRaw || [];
    const auditLogs = auditLogsRaw || [];

    // Map clients by ID for lookup
    const clientMap = new Map<string, any>();
    for (const c of clients) {
      clientMap.set(c.id, c);
    }

    // 1. Calculate Phase 2A MRR Metrics (Preserved Source of Truth)
    let operatingMrrCents = 0;
    let stripeMrrCents = 0;
    let manualMrrCents = 0;
    let pastDueMrrCents = 0;
    let pendingMrrCents = 0;
    let openInvoicesTotalCents = 0;
    let pastDueInvoicesTotalCents = 0;
    let activePayingRetainersCount = 0;

    const subscriptionsList: any[] = [];
    const invoicesList: any[] = [];
    const paymentsList: any[] = [];
    const exceptionsList: any[] = [];

    // Source validation counters
    let classADirectVerifiedCount = 0; // Verified live Stripe subscription object
    let classBProposedEmailCount = 0;  // Proposed email match
    let classCManualAgreementCount = 0; // Manual agreement (wire/ACH)
    let classDUnmappedCount = 0;       // Unmatched exception
    let classEScheduledInstallmentCount = 0; // Staged scheduled installment

    for (const s of subscriptions) {
      const client = clientMap.get(s.client_profile_id);
      const isPartnership = client?.plan === "partnership" || client?.plan === "nda" || client?.is_partnership;
      const isCommissionOnly = client?.pricing_model === "commission" || s.pricing_model === "commission";

      if (isPartnership || (isCommissionOnly && (Number(s.monthly_amount) || 0) === 0)) {
        continue;
      }

      const amountCents = Math.round((Number(s.monthly_amount) || 0) * 100);
      const hasStripeSub = Boolean(s.stripe_subscription_id && s.stripe_subscription_id.startsWith("sub_"));
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";

      // Evidence classification
      let sourceValidationClass: string;
      if (hasStripeSub) {
        sourceValidationClass = "class_b_stripe_verified";
        classADirectVerifiedCount++;
      } else if (s.subscription_status === "pending_payment") {
        sourceValidationClass = "class_a_supabase";
        classEScheduledInstallmentCount++;
      } else if (s.payment_channel === "ach" || s.payment_channel === "wire" || (!hasStripeSub && s.subscription_status === "active")) {
        sourceValidationClass = "class_d_manual_agreement";
        classCManualAgreementCount++;
      } else if (client?.email) {
        sourceValidationClass = "class_c_proposed_email";
        classBProposedEmailCount++;
      } else {
        sourceValidationClass = "class_e_unmatched";
        classDUnmappedCount++;
      }

      if (s.subscription_status === "active") {
        operatingMrrCents += amountCents;
        if (amountCents > 0) {
          activePayingRetainersCount++;
        }
        if (hasStripeSub) {
          stripeMrrCents += amountCents;
        } else {
          manualMrrCents += amountCents;
        }
      } else if (s.subscription_status === "past_due") {
        pastDueMrrCents += amountCents;
      } else if (s.subscription_status === "pending_payment") {
        pendingMrrCents += amountCents;
      }

      subscriptionsList.push({
        id: s.id,
        clientId: s.client_profile_id,
        clientName,
        clientEmail: client?.email || "",
        label: s.label,
        plan: s.plan || client?.plan || "custom",
        monthlyAmountCents: amountCents,
        billingDay: s.billing_day || 1,
        subscriptionStatus: s.subscription_status,
        billingChannel: hasStripeSub ? "stripe_automated" : "manual_retainer",
        stripeSubscriptionId: s.stripe_subscription_id || null,
        stripeCustomerId: s.stripe_customer_id || client?.stripe_customer_id || null,
        sourceValidationClass,
        nextBillingDate: s.next_billing_date || null,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      });
    }

    // 2. Process Authoritative Subledger Invoices (billing_invoices) + Legacy One-Time Payments (client_one_time_payments)
    const now = new Date();
    const seenOtpIds = new Set<string>();
    const seenStripeInvoiceIds = new Set<string>();

    for (const binv of billingInvoices) {
      if (binv.legacy_one_time_payment_id) seenOtpIds.add(binv.legacy_one_time_payment_id);
      if (binv.stripe_invoice_id) seenStripeInvoiceIds.add(binv.stripe_invoice_id);

      const totalCents = Number(binv.total_amount_cents) || 0;
      const paidCents = Number(binv.amount_paid_cents) || 0;
      const dueCents = Number(binv.amount_due_cents) || 0;
      const client = clientMap.get(binv.client_profile_id);
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";
      const isOverdue = binv.due_date ? new Date(binv.due_date) < now && binv.status !== "paid" && binv.status !== "void" : false;
      const effectiveStatus = binv.status === "open" && isOverdue ? "past_due" : binv.status;

      if (effectiveStatus === "open" || effectiveStatus === "past_due" || effectiveStatus === "partially_paid") {
        openInvoicesTotalCents += dueCents;
        if (effectiveStatus === "past_due" || isOverdue) {
          pastDueInvoicesTotalCents += dueCents;
        }
      }

      invoicesList.push({
        id: binv.id,
        clientId: binv.client_profile_id,
        clientName,
        clientEmail: client?.email || "",
        invoiceNumber: binv.invoice_number,
        description: binv.description || "Invoice",
        totalAmountCents: totalCents,
        amountPaidCents: paidCents,
        amountDueCents: dueCents,
        currency: binv.currency || "usd",
        status: effectiveStatus,
        dueDate: binv.due_date,
        paidAt: binv.paid_at || null,
        billingChannel: binv.billing_channel || "stripe",
        stripeInvoiceId: binv.stripe_invoice_id || null,
        hostedInvoiceUrl: binv.hosted_invoice_url || null,
        createdAt: binv.created_at,
      });
    }

    for (const otp of otps) {
      if (seenOtpIds.has(otp.id) || (otp.stripe_invoice_id && seenStripeInvoiceIds.has(otp.stripe_invoice_id))) {
        continue;
      }
      const amtCents = Math.round((Number(otp.amount) || 0) * 100);
      const client = clientMap.get(otp.client_profile_id);
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";
      const isOverdue = otp.due_date ? new Date(otp.due_date) < now : false;

      if (otp.status === "open") {
        openInvoicesTotalCents += amtCents;
        if (isOverdue) {
          pastDueInvoicesTotalCents += amtCents;
        }
      }

      invoicesList.push({
        id: otp.id,
        clientId: otp.client_profile_id,
        clientName,
        clientEmail: client?.email || "",
        invoiceNumber: otp.invoice_number || `INV-${otp.id.substring(0, 8).toUpperCase()}`,
        description: otp.description || "One-Time Payment",
        totalAmountCents: amtCents,
        amountPaidCents: otp.status === "paid" ? amtCents : 0,
        amountDueCents: otp.status === "paid" ? 0 : amtCents,
        currency: otp.currency || "usd",
        status: otp.status === "paid" ? "paid" : (isOverdue ? "past_due" : "open"),
        dueDate: otp.due_date,
        paidAt: otp.paid_at || null,
        billingChannel: otp.stripe_invoice_id ? "stripe" : "manual_ach",
        stripeInvoiceId: otp.stripe_invoice_id || null,
        hostedInvoiceUrl: otp.hosted_invoice_url || null,
        createdAt: otp.created_at,
      });
    }

    // 3. Process Authoritative Subledger Payments (billing_payments) + Verified Manual Confirmations
    const seenBankRefs = new Set<string>();
    for (const bpmt of billingPayments) {
      if (bpmt.bank_reference_number) seenBankRefs.add(bpmt.bank_reference_number);
      const client = bpmt.client_profile_id ? clientMap.get(bpmt.client_profile_id) : null;
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Unmatched Payment";

      paymentsList.push({
        id: bpmt.id,
        clientId: bpmt.client_profile_id || "",
        clientName,
        paymentChannel: bpmt.payment_channel || "stripe",
        status: bpmt.status || "succeeded",
        grossAmountCents: Number(bpmt.gross_amount_cents) || 0,
        feeAmountCents: Number(bpmt.fee_amount_cents) || 0,
        netAmountCents: Number(bpmt.net_amount_cents) || 0,
        currency: bpmt.currency || "usd",
        bankReferenceNumber: bpmt.bank_reference_number || bpmt.stripe_charge_id || "-",
        sendingBank: bpmt.payment_method_summary?.bankName || undefined,
        settledAt: bpmt.settled_at,
        reconciled: Boolean(bpmt.reconciled),
        reconciledAt: bpmt.reconciled_at || null,
        evidenceStatus: bpmt.reconciled ? "verified" : "pending_verification",
        notes: bpmt.notes || "",
      });
    }

    // Extract client bank transfer confirmations (ONLY verified ones enter paymentsList; unverified enter exceptionsList)
    for (const c of clients) {
      const conf = c.contract_details?.bankTransferConfirmation;
      if (!conf) continue;

      const clientName = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
      const refNum = conf.clearedBankRef || conf.referenceNumber || "";

      if (conf.status === "verified" && (!refNum || !seenBankRefs.has(refNum))) {
        const verifiedCents = Number(conf.verifiedAmountCents) || 0;
        if (verifiedCents > 0) {
          paymentsList.push({
            id: `manual_conf_${c.id}`,
            clientId: c.id,
            clientName,
            paymentChannel: "ach",
            status: "succeeded",
            grossAmountCents: verifiedCents,
            feeAmountCents: 0,
            netAmountCents: verifiedCents,
            currency: conf.currency || "usd",
            bankReferenceNumber: refNum || "VERIFIED",
            sendingBank: conf.sendingBank || conf.bankName || undefined,
            settledAt: conf.verifiedAt || conf.submittedAt || c.created_at,
            reconciled: true,
            reconciledAt: conf.verifiedAt || null,
            evidenceStatus: "verified",
            notes: conf.notes || "",
          });
        }
      } else if (conf.status === "pending_verification" || conf.status === "submitted") {
        exceptionsList.push({
          id: `pending_transfer_${c.id}`,
          clientId: c.id,
          clientName,
          exceptionType: "unmatched_transaction",
          severity: "high",
          status: "open",
          title: `Bank Transfer Awaiting Verification: ${conf.amount || "Submitted Transfer"}`,
          description: `Client reported bank transfer${conf.sendingBank ? ` from ${conf.sendingBank}` : ""}${conf.referenceNumber ? ` (Ref: ${conf.referenceNumber})` : " (No reference provided)"}. Funds must be independently confirmed in agency operating account before service activation.`,
          suggestedAction: "Inspect operating bank statement; verify cleared funds once financial mutations are enabled.",
          createdAt: conf.submittedAt || c.updated_at,
        });
      }
    }

    // Include any explicit manual_payment_submissions awaiting verification
    for (const msub of manualSubmissions) {
      if (msub.status === "pending_verification") {
        const client = clientMap.get(msub.client_profile_id);
        const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";
        exceptionsList.push({
          id: `msub_${msub.id}`,
          clientId: msub.client_profile_id,
          clientName,
          exceptionType: "unmatched_transaction",
          severity: "high",
          status: "open",
          title: `Manual Wire Submission: $${(Number(msub.amount_cents || 0) / 100).toLocaleString()}`,
          description: `Wire reference ${msub.wire_reference_number} from ${msub.sending_bank} awaiting verification.`,
          suggestedAction: "Confirm cleared funds in bank statement before verifying.",
          createdAt: msub.submitted_at,
        });
      }
    }

    // Include any explicit rows from billing_exceptions
    for (const bexc of billingExceptions) {
      const client = bexc.client_profile_id ? clientMap.get(bexc.client_profile_id) : null;
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Unassigned";
      exceptionsList.push({
        id: bexc.id,
        clientId: bexc.client_profile_id || "",
        clientName,
        exceptionType: bexc.exception_type,
        severity: bexc.severity,
        status: bexc.status,
        title: bexc.title,
        description: bexc.description,
        suggestedAction: bexc.suggested_action || undefined,
        createdAt: bexc.created_at,
      });
    }

    // Include Exceptions from past_due and pending_payment subscriptions
    for (const s of subscriptionsList) {
      if (s.subscriptionStatus === "past_due") {
        exceptionsList.push({
          id: `past_due_sub_${s.id}`,
          clientId: s.clientId,
          clientName: s.clientName,
          exceptionType: "failed_charge",
          severity: "critical",
          status: "open",
          title: `Past-Due Subscription: ${s.clientName} ($${(s.monthlyAmountCents / 100).toLocaleString()}/mo)`,
          description: `Subscription "${s.label}" (${s.stripeSubscriptionId || "manual"}) failed recurring renewal. Retainer collection is past due and isolated from Operating MRR.`,
          suggestedAction: "Retry payment method or contact client to update card in billing portal.",
          createdAt: s.updatedAt,
        });
      } else if (s.subscriptionStatus === "pending_payment") {
        exceptionsList.push({
          id: `pending_sub_${s.id}`,
          clientId: s.clientId,
          clientName: s.clientName,
          exceptionType: "installment_mismatch",
          severity: "medium",
          status: "open",
          title: `Scheduled Installment Pending: ${s.clientName} ($${(s.monthlyAmountCents / 100).toLocaleString()}/mo)`,
          description: `Subscription line "${s.label}" (Billing Day ${s.billingDay}) is staged in pending_payment status awaiting settlement.`,
          suggestedAction: "Monitor scheduled installment settlement or send checkout link.",
          createdAt: s.updatedAt,
        });
      }
    }

    // Apply Filters
    let filteredSubs = subscriptionsList;
    let filteredInvoices = invoicesList;
    let filteredPayments = paymentsList;
    let filteredExceptions = exceptionsList;

    if (clientIdFilter) {
      filteredSubs = filteredSubs.filter(s => s.clientId === clientIdFilter);
      filteredInvoices = filteredInvoices.filter(i => i.clientId === clientIdFilter);
      filteredPayments = filteredPayments.filter(p => p.clientId === clientIdFilter);
      filteredExceptions = filteredExceptions.filter(e => e.clientId === clientIdFilter);
    }

    if (statusFilter) {
      filteredSubs = filteredSubs.filter(s => s.subscriptionStatus === statusFilter);
      filteredInvoices = filteredInvoices.filter(i => i.status === statusFilter);
      filteredPayments = filteredPayments.filter(p => p.status === statusFilter);
      filteredExceptions = filteredExceptions.filter(e => e.status === statusFilter);
    }

    if (searchFilter) {
      filteredSubs = filteredSubs.filter(s => s.clientName.toLowerCase().includes(searchFilter) || s.label.toLowerCase().includes(searchFilter));
      filteredInvoices = filteredInvoices.filter(i => i.clientName.toLowerCase().includes(searchFilter) || i.invoiceNumber.toLowerCase().includes(searchFilter));
      filteredPayments = filteredPayments.filter(p => p.clientName.toLowerCase().includes(searchFilter) || p.bankReferenceNumber.toLowerCase().includes(searchFilter));
      filteredExceptions = filteredExceptions.filter(e => e.clientName.toLowerCase().includes(searchFilter) || e.title.toLowerCase().includes(searchFilter));
    }

    // Apply Pagination
    const paginateArray = (arr: any[]) => {
      const total = arr.length;
      const items = arr.slice(pagination.offset, pagination.offset + pagination.pageSize);
      return {
        items,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
      };
    };

    // Filter Financial Audits
    const financialAudits = auditLogs.filter(
      (l: any) => l.category === "financial" || l.action?.includes("payment") || l.action?.includes("billing") || l.action?.includes("client")
    );

    // =========================================================================
    // Server-Side Unpaginated Financial KPI Aggregation (Section 5 Invariant)
    // All headline metrics are computed from the full dataset, NOT the paginated slice
    // =========================================================================
    const isSubledgerActive = Deno.env.get("FEATURE_BILLING_SUBLEDGER_ENABLED") === "true";
    const isMutationsActive = Deno.env.get("FEATURE_FINANCIAL_MUTATIONS_ENABLED") === "true";
    const verifiedFullPayments = paymentsList.filter(
      (p: any) => p.status === "succeeded" && p.reconciled === true
    );
    const hasVerifiedCash = isSubledgerActive && verifiedFullPayments.length > 0;

    const fullGrossCollectionsCents = hasVerifiedCash
      ? verifiedFullPayments.reduce((sum: number, p: any) => sum + (p.grossAmountCents || 0), 0)
      : null;

    const fullFeesCents = hasVerifiedCash
      ? verifiedFullPayments.reduce((sum: number, p: any) => sum + (p.feeAmountCents || 0), 0)
      : null;

    const fullNetCashCents = (fullGrossCollectionsCents !== null && fullFeesCents !== null)
      ? fullGrossCollectionsCents - fullFeesCents
      : null;

    // Bank payouts: segregated operating account transfers (non-revenue)
    const fullPayoutsCents = hasVerifiedCash ? 0 : null;

    const responsePayload = {
      feature_flags: {
        billing_subledger_enabled: isSubledgerActive,
        financial_mutations_enabled: isMutationsActive,
      },
      dataFreshness: {
        asOf: new Date().toISOString(),
        isLiveStripe: true,
        subledgerActive: isSubledgerActive,
        mutationsEnabled: isMutationsActive,
        cacheTtlSeconds: 0,
      },
      overview: {
        operatingMrrCents,
        operatingMrrFormatted: `$${(operatingMrrCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        stripeMrrCents,
        stripeMrrFormatted: `$${(stripeMrrCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        manualMrrCents,
        manualMrrFormatted: `$${(manualMrrCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        pastDueMrrCents,
        pendingMrrCents,
        activePayingRetainersCount,
        totalSubscriptionLinesCount: subscriptionsList.length,
        grossCollectionsMtdCents: fullGrossCollectionsCents,
        stripeFeesMtdCents: fullFeesCents,
        netSettledCashMtdCents: fullNetCashCents,
        bankPayoutsMtdCents: fullPayoutsCents,
        collectedRevenueMtdCents: fullGrossCollectionsCents ?? 0,
        collectedRevenueStatus: hasVerifiedCash ? "verified" : "reconciliation_pending",
        financialMetricsStatus: hasVerifiedCash ? "verified" : "reconciliation_pending",
        openInvoicesTotalCents,
        pastDueInvoicesTotalCents,
        openExceptionsCount: exceptionsList.length,
        sourceValidationCounts: {
          classA_directVerified: classADirectVerifiedCount,
          classB_proposedEmail: classBProposedEmailCount,
          classC_manualAgreement: classCManualAgreementCount,
          classD_unmappedException: classDUnmappedCount,
          classE_scheduledInstallment: classEScheduledInstallmentCount,
          classA_supabase: classEScheduledInstallmentCount,
          classB_stripeVerified: classADirectVerifiedCount,
          classC_proposedEmail: classBProposedEmailCount,
          classD_manualAgreement: classCManualAgreementCount,
          classE_unmatched: classDUnmappedCount,
        },
      },
      subscriptions: paginateArray(filteredSubs),
      invoices: paginateArray(filteredInvoices),
      payments: paginateArray(filteredPayments),
      exceptions: paginateArray(filteredExceptions),
      auditLogs: paginateArray(financialAudits),
    };

    return new Response(
      JSON.stringify(responsePayload),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[get-admin-billing-overview Error]:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}));
