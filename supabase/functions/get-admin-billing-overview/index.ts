import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
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

serve(async (req) => {
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

    const token = authHeader.replace("Bearer ", "");
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
      const body = await req.json();
      const action = body.action || "verify_manual_payment";

      if (action === "verify_manual_payment") {
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
      }


      if (action === "resolve_billing_exception") {
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

    // =========================================================================
    // GET HANDLER: Typed, Paginated Financial Read API
    // =========================================================================
    const pagination = parsePagination(url);
    const tab = url.searchParams.get("tab") || "all";
    const statusFilter = url.searchParams.get("status");
    const clientIdFilter = url.searchParams.get("clientId");
    const searchFilter = url.searchParams.get("search")?.toLowerCase().trim();

    // Query core data tables in parallel
    const [
      { data: clientsRaw, error: clientsErr },
      { data: subscriptionsRaw, error: subsErr },
      { data: otpsRaw, error: otpsErr },
      { data: auditLogsRaw, error: auditErr },
    ] = await Promise.all([
      supabaseAdmin.from("client_profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("client_subscriptions").select("*").order("created_at", { ascending: true }),
      supabaseAdmin.from("client_one_time_payments").select("*").order("due_date", { ascending: true }),
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
    let classACount = 0; // Verified Supabase
    let classBCount = 0; // Verified Stripe source object
    let classCCount = 0; // Proposed email match
    let classDCount = 0; // Manual agreement (wire/ACH)
    let classECount = 0; // Unmatched exception

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
      let sourceValidationClass: "class_a_supabase" | "class_b_stripe_verified" | "class_c_proposed_email" | "class_d_manual_agreement" | "class_e_unmatched";
      if (hasStripeSub) {
        sourceValidationClass = "class_b_stripe_verified";
        classBCount++;
      } else if (s.payment_channel === "ach" || s.payment_channel === "wire" || (!hasStripeSub && s.subscription_status === "active")) {
        sourceValidationClass = "class_d_manual_agreement";
        classDCount++;
      } else if (client?.email) {
        sourceValidationClass = "class_a_supabase";
        classACount++;
      } else {
        sourceValidationClass = "class_e_unmatched";
        classECount++;
      }

      if (s.subscription_status === "active") {
        operatingMrrCents += amountCents;
        activePayingRetainersCount++;
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

    // Process One-Time Payments / Invoices
    const now = new Date();
    for (const otp of otps) {
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
        currency: "usd",
        status: otp.status === "paid" ? "paid" : (isOverdue ? "past_due" : "open"),
        dueDate: otp.due_date,
        paidAt: otp.paid_at || null,
        billingChannel: otp.stripe_invoice_id ? "stripe" : "manual_ach",
        stripeInvoiceId: otp.stripe_invoice_id || null,
        createdAt: otp.created_at,
      });
    }

    // Extract manual payments and submissions
    for (const c of clients) {
      const conf = c.contract_details?.bankTransferConfirmation;
      if (conf) {
        paymentsList.push({
          id: `manual_conf_${c.id}`,
          clientId: c.id,
          clientName: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email,
          paymentChannel: "ach",
          status: conf.status === "verified" ? "succeeded" : "pending",
          grossAmountCents: conf.verifiedAmountCents || 494700,
          feeAmountCents: 0,
          netAmountCents: conf.verifiedAmountCents || 494700,
          currency: "usd",
          bankReferenceNumber: conf.clearedBankRef || conf.referenceNumber || "PENDING",
          sendingBank: conf.sendingBank || "Wise / Column Bank",
          settledAt: conf.verifiedAt || conf.submittedAt || c.created_at,
          reconciled: conf.status === "verified",
          reconciledAt: conf.verifiedAt || null,
          evidenceStatus: conf.status,
          notes: conf.notes || "",
        });

        if (conf.status === "pending_verification") {
          exceptionsList.push({
            id: `pending_transfer_${c.id}`,
            clientId: c.id,
            clientName: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email,
            exceptionType: "unmatched_transaction",
            severity: "high",
            status: "open",
            title: `Bank Transfer Awaiting Verification: ${conf.amount || "$4,947"}`,
            description: `Client reported bank transfer from ${conf.sendingBank || "Bank"} (Ref: ${conf.referenceNumber}). Funds must be independently confirmed before service activation.`,
            suggestedAction: "Check Column/Wise operating account, verify funds, and click 'Verify Payment'.",
            createdAt: conf.submittedAt || c.updated_at,
          });
        }
      }
    }

    // Filter Exceptions from past due subscriptions
    for (const s of subscriptionsList) {
      if (s.subscriptionStatus === "past_due") {
        exceptionsList.push({
          id: `past_due_sub_${s.id}`,
          clientId: s.clientId,
          clientName: s.clientName,
          exceptionType: "failed_charge",
          severity: "critical",
          status: "open",
          title: `Past-Due Subscription: $${(s.monthlyAmountCents / 100).toLocaleString()}/mo`,
          description: `Subscription "${s.label}" failed recurring renewal. Retainer collection is past due.`,
          suggestedAction: "Retry payment method or contact client to update card.",
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
        totalPages: Math.ceil(total / pagination.pageSize),
      };
    };

    // Filter Financial Audits
    const financialAudits = auditLogs.filter(
      (l: any) => l.category === "financial" || l.action.includes("payment") || l.action.includes("billing")
    );

    const responsePayload = {
      dataFreshness: {
        asOf: new Date().toISOString(),
        isLiveStripe: true,
        subledgerActive: Deno.env.get("FEATURE_BILLING_SUBLEDGER_ENABLED") === "true",
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
        collectedRevenueMtdCents: 0, // Invariant: collected revenue status is explicitly reconciliation_pending
        collectedRevenueStatus: "reconciliation_pending",
        openInvoicesTotalCents,
        pastDueInvoicesTotalCents,
        openExceptionsCount: exceptionsList.length,
        sourceValidationCounts: {
          classA_supabase: classACount,
          classB_stripeVerified: classBCount,
          classC_proposedEmail: classCCount,
          classD_manualAgreement: classDCount,
          classE_unmatched: classECount,
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
});
