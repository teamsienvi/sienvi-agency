import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExecutiveMetricsResponse, AttentionQueueItem, ActiveSubscriptionItem } from "@/types/executive-metrics";

/**
 * Reconciled client-side aggregation fallback.
 * Uses identical domain rules as get-admin-executive-metrics Edge Function.
 */
function aggregateClientSide(
  clients: any[],
  subscriptions: any[],
  oneTimePayments: any[],
  auditLogs: any[]
): ExecutiveMetricsResponse {
  let operatingMrr = 0;
  let stripeMrr = 0;
  let manualMrr = 0;
  let pastDueMrr = 0;
  let pendingMrr = 0;
  let openInvoicesTotal = 0;
  let pastDueInvoicesTotal = 0;

  const now = new Date();
  const clientsMap = new Map(clients.map((c) => [c.id, c]));
  const activeSubsBreakdown: ActiveSubscriptionItem[] = [];
  const attentionQueue: AttentionQueueItem[] = [];

  for (const s of subscriptions) {
    const client = clientsMap.get(s.client_profile_id);
    const isPartnership = client?.plan === "partnership" || client?.plan === "nda" || client?.is_partnership;
    const isCommissionOnly = client?.pricing_model === "commission" || s.pricing_model === "commission";

    if (isPartnership || (isCommissionOnly && s.monthly_amount === 0)) continue;

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

  for (const otp of oneTimePayments) {
    if (otp.status === "open") {
      const amt = Number(otp.amount) || 0;
      openInvoicesTotal += amt;
      const client = clientsMap.get(otp.client_profile_id);
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";
      const isOverdue = otp.due_date ? new Date(otp.due_date) < now : false;

      if (isOverdue) {
        pastDueInvoicesTotal += amt;
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

  for (const c of clients) {
    const isPartnership = c.plan === "partnership" || c.plan === "nda";
    const isCanceled = c.subscription_status === "canceled";
    if (isCanceled || isPartnership) continue;

    const clientName = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
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

  const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  attentionQueue.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

  const recentActivity: any[] = [];
  for (const log of auditLogs) {
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

  for (const c of clients.slice(0, 10)) {
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

  const clientHealth = {
    total: clients.length,
    active: clients.filter((c) => c.subscription_status === "active" && c.plan !== "partnership" && c.plan !== "nda").length,
    onboarding: clients.filter((c) => c.onboarding_status === "in_progress" || c.onboarding_status === "not_started").length,
    pastDue: clients.filter((c) => c.subscription_status === "past_due").length,
    pending: clients.filter((c) => c.subscription_status === "pending_payment").length,
    partnership: clients.filter((c) => c.plan === "partnership" || c.plan === "nda").length,
    canceled: clients.filter((c) => c.subscription_status === "canceled").length,
  };

  return {
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
      totalSubscriptionsCount: subscriptions.length,
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
          count: activeSubsBreakdown.filter((s) => s.channel === "stripe_automated").length,
          amount: stripeMrr,
          percentage: operatingMrr > 0 ? Number(((stripeMrr / operatingMrr) * 100).toFixed(1)) : 0,
        },
        {
          name: "Manual / ACH Retainers",
          count: activeSubsBreakdown.filter((s) => s.channel === "manual_retainer").length,
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
}

export function useExecutiveMetrics() {
  const [data, setData] = useState<ExecutiveMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Administrative session expired. Please sign in again.");
      }

      // Try invoking the get-admin-executive-metrics edge function
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
        "get-admin-executive-metrics",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!edgeError && edgeData && edgeData.revenue) {
        setData(edgeData as ExecutiveMetricsResponse);
        return;
      }

      // Resilient fallback: fetch direct tables via authorized admin session
      const [
        { data: clients, error: clientsErr },
        { data: subs, error: subsErr },
        { data: otps, error: otpsErr },
        { data: auditLogs, error: auditErr },
      ] = await Promise.all([
        supabase.from("client_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("client_subscriptions").select("*").order("created_at", { ascending: true }),
        supabase.from("client_one_time_payments").select("*").order("due_date", { ascending: true }),
        supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      if (clientsErr || subsErr) {
        throw new Error(clientsErr?.message || subsErr?.message || "Failed to load operational data");
      }

      const aggregated = aggregateClientSide(
        clients || [],
        subs || [],
        otps || [],
        auditLogs || []
      );

      setData(aggregated);
    } catch (err: any) {
      console.error("[useExecutiveMetrics] Error:", err);
      setError(err.message || "Failed to load executive operations data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => fetchMetrics(true),
  };
}
