import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttentionItem {
  id: string;
  type: "failed_payment" | "overdue_invoice" | "unsigned_agreement" | "pending_installment" | "overdue_onboarding";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  clientName: string;
  clientId: string;
  amount?: number;
  evidenceTimestamp: string;
  actionLabel: string;
  actionLink: string;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor: string;
  status: "success" | "warning" | "info";
  clientId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Strict Server-Side JWT & Admin Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user_roles table for 'admin'
    const { data: roleData, error: roleError } = await supabase
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

    // 2. Fetch raw tables in parallel (Read-only access)
    const [
      { data: clients, error: clientsErr },
      { data: subscriptions, error: subsErr },
      { data: oneTimePayments, error: otpsErr },
      { data: auditLogs, error: auditErr },
    ] = await Promise.all([
      supabase.from("client_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("client_subscriptions").select("*").order("created_at", { ascending: true }),
      supabase.from("client_one_time_payments").select("*").order("due_date", { ascending: true }),
      supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    if (clientsErr || subsErr) {
      console.error("[Metrics] Database fetch error:", clientsErr || subsErr);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve financial source records" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientList = clients || [];
    const subsList = subscriptions || [];
    const otpsList = oneTimePayments || [];
    const auditList = auditLogs || [];

    // Map clients by id
    const clientsMap = new Map();
    for (const c of clientList) {
      clientsMap.set(c.id, c);
    }

    // 3. Domain Financial Aggregation
    let operatingMrr = 0;
    let stripeMrr = 0;
    let manualMrr = 0;
    let pastDueMrr = 0;
    let pendingMrr = 0;
    let openInvoicesTotal = 0;
    let pastDueInvoicesTotal = 0;

    const now = new Date();
    const activeSubsBreakdown: any[] = [];
    const attentionQueue: AttentionItem[] = [];

    // Process Subscriptions
    for (const s of subsList) {
      const client = clientsMap.get(s.client_profile_id);
      const isPartnership = client?.plan === "partnership" || client?.plan === "nda" || client?.is_partnership;
      const isCommissionOnly = client?.pricing_model === "commission" || s.pricing_model === "commission";

      if (isPartnership || (isCommissionOnly && s.monthly_amount === 0)) {
        continue;
      }

      const amount = Number(s.monthly_amount) || 0;
      const hasStripeSub = Boolean(s.stripe_subscription_id && s.stripe_subscription_id.startsWith("sub_"));
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";

      if (s.subscription_status === "active") {
        operatingMrr += amount;
        if (hasStripeSub) {
          stripeMrr += amount;
        } else {
          manualMrr += amount;
        }

        activeSubsBreakdown.push({
          id: s.id,
          clientId: s.client_profile_id,
          clientName,
          label: s.label,
          amount,
          channel: hasStripeSub ? "stripe_automated" : "manual_retainer",
          billingDay: s.billing_day,
          nextBillingDate: s.next_billing_date,
        });
      } else if (s.subscription_status === "past_due") {
        pastDueMrr += amount;
        // Priority 1: Failed or past-due recurring payments
        attentionQueue.push({
          id: `past_due_sub_${s.id}`,
          type: "failed_payment",
          severity: "critical",
          title: `Past-Due Subscription: $${amount.toLocaleString()}/mo`,
          description: `Subscription "${s.label}" for ${clientName} failed renewal. Action required to recover retainer.`,
          clientName,
          clientId: s.client_profile_id,
          amount,
          evidenceTimestamp: s.updated_at || s.created_at,
          actionLabel: "View Billing & Invoices",
          actionLink: `/admin/clients/${s.client_profile_id}?tab=billing`,
        });
      } else if (s.subscription_status === "pending_payment") {
        pendingMrr += amount;
        // Priority 5: Pending installment or setup
        attentionQueue.push({
          id: `pending_sub_${s.id}`,
          type: "pending_installment",
          severity: "medium",
          title: `Pending Installment: $${amount.toLocaleString()}/mo`,
          description: `Installment "${s.label}" for ${clientName} is pending payment initiation (Billing Day: ${s.billing_day || 30}).`,
          clientName,
          clientId: s.client_profile_id,
          amount,
          evidenceTimestamp: s.created_at,
          actionLabel: "Manage Retainer",
          actionLink: `/admin/clients/${s.client_profile_id}?tab=billing`,
        });
      }
    }

    // Process One-Time Invoices
    for (const otp of otpsList) {
      if (otp.status === "open") {
        const amt = Number(otp.amount) || 0;
        openInvoicesTotal += amt;
        const client = clientsMap.get(otp.client_profile_id);
        const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";
        const isOverdue = otp.due_date ? new Date(otp.due_date) < now : false;

        if (isOverdue) {
          pastDueInvoicesTotal += amt;
          // Priority 2: Overdue open invoices
          attentionQueue.push({
            id: `overdue_otp_${otp.id}`,
            type: "overdue_invoice",
            severity: "high",
            title: `Overdue Invoice: $${amt.toLocaleString()}`,
            description: `Invoice "${otp.description || "One-Time Payment"}" for ${clientName} is past due (Due: ${new Date(otp.due_date).toLocaleDateString()}).`,
            clientName,
            clientId: otp.client_profile_id,
            amount: amt,
            evidenceTimestamp: otp.due_date,
            actionLabel: "Open Invoice Workspace",
            actionLink: `/admin/clients/${otp.client_profile_id}?tab=billing`,
          });
        }
      }
    }

    // Process Client Agreements & Onboarding Alerts
    for (const c of clientList) {
      const clientName = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
      const isPartnership = c.plan === "partnership" || c.plan === "nda";
      const isCanceled = c.subscription_status === "canceled";

      // Do NOT alert for normal canceled accounts or completed partnerships
      if (isCanceled || isPartnership) {
        continue;
      }

      // Priority 3: Agreements requiring signature
      if (c.contract_status === "not_signed" || c.contract_status === "pending" || c.contract_status === "partially_signed") {
        attentionQueue.push({
          id: `unsigned_contract_${c.id}`,
          type: "unsigned_agreement",
          severity: c.contract_status === "partially_signed" ? "medium" : "high",
          title: c.contract_status === "partially_signed" ? "Agreement Awaiting Co-Signature" : "Agreement Signature Required",
          description: `${clientName} has an active engagement awaiting formal digital signature completion.`,
          clientName,
          clientId: c.id,
          evidenceTimestamp: c.created_at,
          actionLabel: "Review Agreement",
          actionLink: `/admin/clients/${c.id}?tab=agreement`,
        });
      }

      // Priority 4: Genuinely overdue onboarding (> 7 days from creation without completion)
      if (c.onboarding_status === "in_progress" || c.onboarding_status === "not_started") {
        const createdMs = new Date(c.created_at).getTime();
        const ageDays = (now.getTime() - createdMs) / (1000 * 60 * 60 * 24);
        if (ageDays > 7 && c.subscription_status === "active") {
          attentionQueue.push({
            id: `overdue_onboarding_${c.id}`,
            type: "overdue_onboarding",
            severity: "medium",
            title: `Onboarding Delayed (${Math.floor(ageDays)} days)`,
            description: `${clientName} has not completed onboarding questionnaires after subscription activation.`,
            clientName,
            clientId: c.id,
            evidenceTimestamp: c.created_at,
            actionLabel: "View Onboarding Responses",
            actionLink: `/admin/clients/${c.id}?tab=onboarding`,
          });
        }
      }
    }

    // Sort Attention Queue by severity: critical -> high -> medium -> low
    const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    attentionQueue.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    // 4. Construct Activity Feed
    const recentActivity: ActivityItem[] = [];

    // Include recent audit log writes
    for (const log of auditList) {
      const targetClient = log.target_client_id ? clientsMap.get(log.target_client_id) : null;
      const targetName = targetClient ? [targetClient.first_name, targetClient.last_name].filter(Boolean).join(" ") : "System";
      recentActivity.push({
        id: `audit_${log.id}`,
        timestamp: log.created_at,
        type: log.action,
        description: `Admin action: ${log.action.replace(/_/g, " ")} on ${targetName}`,
        actor: "Admin",
        status: "info",
        clientId: log.target_client_id || undefined,
      });
    }

    // Include recent client lifecycle updates
    for (const c of clientList.slice(0, 10)) {
      if (c.contract_signed_at) {
        recentActivity.push({
          id: `contract_signed_${c.id}`,
          timestamp: c.contract_signed_at,
          type: "contract_signed",
          description: `Agreement executed by ${[c.first_name, c.last_name].filter(Boolean).join(" ") || c.email}`,
          actor: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email,
          status: "success",
          clientId: c.id,
        });
      }
    }

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 5. Client Health Counts
    const clientHealth = {
      total: clientList.length,
      active: clientList.filter(c => c.subscription_status === "active" && c.plan !== "partnership" && c.plan !== "nda").length,
      onboarding: clientList.filter(c => c.onboarding_status === "in_progress" || c.onboarding_status === "not_started").length,
      pastDue: clientList.filter(c => c.subscription_status === "past_due").length,
      pending: clientList.filter(c => c.subscription_status === "pending_payment").length,
      partnership: clientList.filter(c => c.plan === "partnership" || c.plan === "nda").length,
      canceled: clientList.filter(c => c.subscription_status === "canceled").length,
    };

    // 6. Response Assembly
    const responsePayload = {
      asOf: now.toISOString(),
      dataFreshness: "realtime",
      environment: "production",
      revenue: {
        operatingMrr,
        stripeMrr,
        manualMrr,
        pastDueMrr,
        pendingMrr,
        openInvoicesTotal,
        pastDueInvoicesTotal,
        activeSubscriptionsCount: activeSubsBreakdown.length,
        totalSubscriptionsCount: subsList.length,
        collectedRevenue: {
          status: "reconciliation_pending",
          value: null,
          message: "Collected payment settlement ledger is managed in Stripe. Historical charges not mirrored in local database.",
        },
      },
      composition: {
        channels: [
          {
            name: "Stripe Recurring",
            count: activeSubsBreakdown.filter(s => s.channel === "stripe_automated").length,
            amount: stripeMrr,
            percentage: operatingMrr > 0 ? Number(((stripeMrr / operatingMrr) * 100).toFixed(1)) : 0,
          },
          {
            name: "Manual / ACH Retainers",
            count: activeSubsBreakdown.filter(s => s.channel === "manual_retainer").length,
            amount: manualMrr,
            percentage: operatingMrr > 0 ? Number(((manualMrr / operatingMrr) * 100).toFixed(1)) : 0,
          },
        ],
        breakdown: activeSubsBreakdown,
      },
      clientHealth,
      attentionQueue,
      recentActivity: recentActivity.slice(0, 10),
    };

    return new Response(
      JSON.stringify(responsePayload),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[get-admin-executive-metrics] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
