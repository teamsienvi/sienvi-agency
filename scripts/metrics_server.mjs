import http from "node:http";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const SUPABASE_URL = "https://jdodjbzypuiyhgrzuyzp.supabase.co";

function getApiKeys() {
  const raw = execSync(
    "npx supabase projects api-keys --project-ref jdodjbzypuiyhgrzuyzp --reveal --output json",
    { encoding: "utf8" }
  );
  const keys = JSON.parse(raw);
  return {
    serviceRoleKey: keys.find((k) => k.name === "service_role").api_key,
    anonKey: keys.find((k) => k.name === "anon").api_key,
  };
}

const { serviceRoleKey } = getApiKeys();
const supabaseAdmin = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "No authorization header provided" }));
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Invalid or expired authorization token" }));
      return;
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: "Access denied. Administrator privileges required." }));
      return;
    }

    const [
      { data: clients, error: cErr },
      { data: subscriptions, error: sErr },
      { data: oneTimePayments, error: otpErr },
      { data: auditLogs, error: aErr },
    ] = await Promise.all([
      supabaseAdmin.from("client_profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("client_subscriptions").select("*").order("created_at", { ascending: true }),
      supabaseAdmin.from("client_one_time_payments").select("*").order("due_date", { ascending: true }),
      supabaseAdmin.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    if (cErr || sErr) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Failed to retrieve financial source records" }));
      return;
    }

    const clientList = clients || [];
    const subsList = subscriptions || [];
    const otpsList = oneTimePayments || [];
    const auditList = auditLogs || [];

    const clientsMap = new Map(clientList.map(c => [c.id, c]));

    let operatingMrrCents = 0;
    let stripeMrrCents = 0;
    let manualMrrCents = 0;
    let pastDueMrrCents = 0;
    let pendingMrrCents = 0;
    let openInvoicesTotalCents = 0;
    let pastDueInvoicesTotalCents = 0;

    const now = new Date();
    const activeSubsBreakdown = [];
    const attentionQueue = [];
    const seenAlertIds = new Set();

    for (const s of subsList) {
      const client = clientsMap.get(s.client_profile_id);
      const isPartnership = client?.plan === "partnership" || client?.plan === "nda" || client?.is_partnership;
      const isCommissionOnly = client?.pricing_model === "commission" || s.pricing_model === "commission";

      if (isPartnership || (isCommissionOnly && (Number(s.monthly_amount) || 0) === 0)) {
        continue;
      }

      const amountCents = Math.round((Number(s.monthly_amount) || 0) * 100);
      const amountDollars = amountCents / 100;
      const hasStripeSub = Boolean(s.stripe_subscription_id && s.stripe_subscription_id.startsWith("sub_"));
      const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";

      if (s.subscription_status === "active") {
        operatingMrrCents += amountCents;
        if (hasStripeSub) {
          stripeMrrCents += amountCents;
        } else {
          manualMrrCents += amountCents;
        }

        activeSubsBreakdown.push({
          id: s.id,
          clientId: s.client_profile_id,
          clientName,
          label: s.label,
          amount: amountDollars,
          channel: hasStripeSub ? "stripe_automated" : "manual_retainer",
          billingDay: s.billing_day,
          nextBillingDate: s.next_billing_date,
        });
      } else if (s.subscription_status === "past_due") {
        pastDueMrrCents += amountCents;
        const alertId = `past_due_sub_${s.id}`;
        if (!seenAlertIds.has(alertId)) {
          seenAlertIds.add(alertId);
          attentionQueue.push({
            id: alertId,
            type: "failed_payment",
            severity: "critical",
            title: `Past-Due Subscription: $${amountDollars.toLocaleString()}/mo`,
            description: `Subscription "${s.label}" for ${clientName} failed renewal. Action required to recover retainer.`,
            clientName,
            clientId: s.client_profile_id,
            amount: amountDollars,
            evidenceTimestamp: s.updated_at || s.created_at,
            actionLabel: "View Billing & Invoices",
            actionLink: `/admin/clients/${s.client_profile_id}?tab=billing`,
          });
        }
      } else if (s.subscription_status === "pending_payment") {
        pendingMrrCents += amountCents;
        const alertId = `pending_sub_${s.id}`;
        if (!seenAlertIds.has(alertId)) {
          seenAlertIds.add(alertId);
          attentionQueue.push({
            id: alertId,
            type: "pending_installment",
            severity: "medium",
            title: `Pending Installment: $${amountDollars.toLocaleString()}/mo`,
            description: `Installment "${s.label}" for ${clientName} is pending payment initiation (Billing Day: ${s.billing_day || 30}).`,
            clientName,
            clientId: s.client_profile_id,
            amount: amountDollars,
            evidenceTimestamp: s.created_at,
            actionLabel: "Manage Retainer",
            actionLink: `/admin/clients/${s.client_profile_id}?tab=billing`,
          });
        }
      }
    }

    for (const otp of otpsList) {
      if (otp.status === "open") {
        const amtCents = Math.round((Number(otp.amount) || 0) * 100);
        const amtDollars = amtCents / 100;
        openInvoicesTotalCents += amtCents;
        const client = clientsMap.get(otp.client_profile_id);
        const clientName = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || client.email : "Client";
        const isOverdue = otp.due_date ? new Date(otp.due_date) < now : false;

        if (isOverdue) {
          pastDueInvoicesTotalCents += amtCents;
          const alertId = `overdue_otp_${otp.id}`;
          if (!seenAlertIds.has(alertId)) {
            seenAlertIds.add(alertId);
            attentionQueue.push({
              id: alertId,
              type: "overdue_invoice",
              severity: "high",
              title: `Overdue Invoice: $${amtDollars.toLocaleString()}`,
              description: `Invoice "${otp.description || "One-Time Payment"}" for ${clientName} is past due (Due: ${new Date(otp.due_date).toLocaleDateString()}).`,
              clientName,
              clientId: otp.client_profile_id,
              amount: amtDollars,
              evidenceTimestamp: otp.due_date,
              actionLabel: "Open Invoice Workspace",
              actionLink: `/admin/clients/${otp.client_profile_id}?tab=billing`,
            });
          }
        }
      }
    }

    for (const c of clientList) {
      const clientName = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
      const isPartnership = c.plan === "partnership" || c.plan === "nda";
      const isCanceled = c.subscription_status === "canceled";
      if (isCanceled || isPartnership) continue;

      if (c.contract_status === "not_signed" || c.contract_status === "pending" || c.contract_status === "partially_signed") {
        const alertId = `unsigned_contract_${c.id}`;
        if (!seenAlertIds.has(alertId)) {
          seenAlertIds.add(alertId);
          attentionQueue.push({
            id: alertId,
            type: "unsigned_agreement",
            severity: c.contract_status === "partially_signed" ? "medium" : "high",
            title: c.contract_status === "partially_signed" ? "Agreement Awaiting Co-Signature" : "Agreement Signature Required",
            description: `${clientName} has an active engagement awaiting formal digital signature completion.`,
            clientName,
            clientId: c.id,
            evidenceTimestamp: c.created_at,
            actionLabel: "Review Agreement",
            actionLink: `/admin/clients/${c.id}?tab=agreements`,
          });
        }
      }

      if (c.onboarding_status === "in_progress" || c.onboarding_status === "not_started") {
        const createdMs = new Date(c.created_at).getTime();
        const ageDays = (now.getTime() - createdMs) / (1000 * 60 * 60 * 24);
        if (ageDays > 7 && c.subscription_status === "active") {
          const alertId = `overdue_onboarding_${c.id}`;
          if (!seenAlertIds.has(alertId)) {
            seenAlertIds.add(alertId);
            attentionQueue.push({
              id: alertId,
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
    }

    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    attentionQueue.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    const recentActivity = [];
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

    const clientHealth = {
      total: clientList.length,
      active: clientList.filter(c => c.subscription_status === "active" && c.plan !== "partnership" && c.plan !== "nda").length,
      onboarding: clientList.filter(c => c.onboarding_status === "in_progress" || c.onboarding_status === "not_started").length,
      pastDue: clientList.filter(c => c.subscription_status === "past_due").length,
      pending: clientList.filter(c => c.subscription_status === "pending_payment").length,
      partnership: clientList.filter(c => c.plan === "partnership" || c.plan === "nda").length,
      canceled: clientList.filter(c => c.subscription_status === "canceled").length,
    };

    const operatingMrr = operatingMrrCents / 100;
    const stripeMrr = stripeMrrCents / 100;
    const manualMrr = manualMrrCents / 100;
    const pastDueMrr = pastDueMrrCents / 100;
    const pendingMrr = pendingMrrCents / 100;
    const openInvoicesTotal = openInvoicesTotalCents / 100;
    const pastDueInvoicesTotal = pastDueInvoicesTotalCents / 100;

    const payload = {
      asOf: now.toISOString(),
      dataFreshness: "realtime",
      environment: "authoritative_http_service",
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
            percentage: operatingMrrCents > 0 ? Number(((stripeMrrCents / operatingMrrCents) * 100).toFixed(1)) : 0,
          },
          {
            name: "Manual / ACH Retainers",
            count: activeSubsBreakdown.filter(s => s.channel === "manual_retainer").length,
            amount: manualMrr,
            percentage: operatingMrrCents > 0 ? Number(((manualMrrCents / operatingMrrCents) * 100).toFixed(1)) : 0,
          },
        ],
        breakdown: activeSubsBreakdown,
      },
      clientHealth,
      attentionQueue,
      recentActivity: recentActivity.slice(0, 10),
    };

    res.writeHead(200);
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(54321, "127.0.0.1", () => {
  console.log("Authoritative metrics service running on http://127.0.0.1:54321");
});
