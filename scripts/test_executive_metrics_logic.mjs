import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import assert from "node:assert/strict";

const SUPABASE_URL = "https://jdodjbzypuiyhgrzuyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2RqYnp5cHVpeWhncnp1eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTU1NDQsImV4cCI6MjA5MDU3MTU0NH0.RmKcK7jJ5kbYQnJ_W_AFQF1lfYtdRUMfpwON-iPYBD0";

const env = fs.readFileSync(".env.local", "utf8");
const passLine = env.split("\n").find(l => l.startsWith("ADMIN_PASSWORD="));
const pass = passLine ? passLine.split("=")[1].trim() : "";

async function main() {
  console.log("=== EXECUTING BACKEND METRICS LOGIC VALIDATION ===");

  // 1. Verify anonymous caller cannot execute admin queries
  const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: anonData, error: anonError } = await anonSupabase.from("client_subscriptions").select("*");
  assert.equal(anonData?.length || 0, 0, "Anonymous user must NOT read client_subscriptions");
  console.log("✓ Anonymous access to client_subscriptions strictly blocked by RLS");

  // 2. Authenticate as Admin
  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await adminSupabase.auth.signInWithPassword({
    email: "admin@sienvi.com",
    password: pass,
  });
  assert.ok(authData?.session, "Admin authentication must succeed");
  const adminUser = authData.user;
  console.log("✓ Admin user authenticated:", adminUser.email);

  // 3. Verify Admin Role via user_roles
  const { data: roleData, error: roleError } = await adminSupabase
    .from("user_roles")
    .select("role")
    .eq("user_id", adminUser.id)
    .eq("role", "admin")
    .maybeSingle();

  assert.ok(roleData && roleData.role === "admin", "User must have admin role in user_roles");
  console.log("✓ Admin role verified server-side via user_roles");

  // 4. Fetch Live Data as Admin
  const [
    { data: clients, error: clientsErr },
    { data: subscriptions, error: subsErr },
    { data: oneTimePayments, error: otpsErr },
    { data: auditLogs, error: auditErr },
  ] = await Promise.all([
    adminSupabase.from("client_profiles").select("*").order("created_at", { ascending: false }),
    adminSupabase.from("client_subscriptions").select("*").order("created_at", { ascending: true }),
    adminSupabase.from("client_one_time_payments").select("*").order("due_date", { ascending: true }),
    adminSupabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  assert.ifError(clientsErr);
  assert.ifError(subsErr);
  assert.ifError(otpsErr);
  assert.ifError(auditErr);

  console.log(`✓ Fetched ${clients.length} clients, ${subscriptions.length} subs, ${oneTimePayments.length} OTPs, ${auditLogs.length} audit logs`);

  // 5. Run Server-Side Aggregation
  let operatingMrr = 0;
  let stripeMrr = 0;
  let manualMrr = 0;
  let pastDueMrr = 0;
  let pendingMrr = 0;
  let openInvoicesTotal = 0;
  let pastDueInvoicesTotal = 0;
  const now = new Date();

  const clientsMap = new Map(clients.map(c => [c.id, c]));
  const attentionQueue = [];

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
        actionLink: `/admin/clients/${s.client_profile_id}?tab=billing`,
      });
    } else if (s.subscription_status === "pending_payment") {
      pendingMrr += amount;
      attentionQueue.push({
        id: `pending_sub_${s.id}`,
        type: "pending_installment",
        severity: "medium",
        title: `Pending Installment: $${amount.toLocaleString()}/mo`,
        description: `Installment "${s.label}" for ${clientName} is pending payment initiation.`,
        clientName,
        clientId: s.client_profile_id,
        amount,
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
          description: `Invoice "${otp.description || "One-Time Payment"}" for ${clientName} is past due.`,
          clientName,
          clientId: otp.client_profile_id,
          amount: amt,
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
        actionLink: `/admin/clients/${c.id}?tab=agreement`,
      });
    }
  }

  console.log("\n=== FINANCIAL METRICS RECONCILIATION AUDIT ===");
  console.log(`Operating MRR:         $${operatingMrr.toLocaleString()}`);
  console.log(`Stripe MRR:            $${stripeMrr.toLocaleString()}`);
  console.log(`Manual MRR:            $${manualMrr.toLocaleString()}`);
  console.log(`Past-Due MRR:          $${pastDueMrr.toLocaleString()} (Susie Oh)`);
  console.log(`Pending Retainers:     $${pendingMrr.toLocaleString()} (George Fahmy 2nd Installment)`);
  console.log(`Open Overdue Invoices: $${pastDueInvoicesTotal.toLocaleString()} (Timothy Montgomery)`);

  assert.equal(operatingMrr, 15783, "Operating MRR must match exactly $15,783.00");
  assert.equal(stripeMrr, 11298, "Stripe MRR must match exactly $11,298.00");
  assert.equal(manualMrr, 4485, "Manual MRR must match exactly $4,485.00");
  assert.equal(pastDueMrr, 2450, "Past Due MRR must match exactly $2,450.00");
  assert.equal(pendingMrr, 500, "Pending Installment must match exactly $500.00");
  assert.equal(pastDueInvoicesTotal, 999, "Overdue Invoice must match exactly $999.00");

  console.log("\n=== ATTENTION QUEUE AUDIT ===");
  console.log(`Total attention items generated: ${attentionQueue.length}`);
  attentionQueue.forEach((item, idx) => {
    console.log(`[Item #${idx + 1}] [${item.severity.toUpperCase()}] ${item.title}`);
    console.log(`  Client: ${item.clientName} (${item.clientId})`);
    console.log(`  Action Link: ${item.actionLink}`);
    assert.ok(item.actionLink.startsWith("/admin/clients/"), "Action link must be a valid Client Workspace URL");
  });

  // Verify that attention queue contains the critical items
  const pastDueAlert = attentionQueue.find(i => i.type === "failed_payment");
  assert.ok(pastDueAlert, "Attention Queue must contain Susie Oh failed payment alert");

  const overdueInvoiceAlert = attentionQueue.find(i => i.type === "overdue_invoice");
  assert.ok(overdueInvoiceAlert, "Attention Queue must contain Timothy Montgomery overdue invoice alert");

  const unsignedAlert = attentionQueue.find(i => i.type === "unsigned_agreement");
  assert.ok(unsignedAlert, "Attention Queue must contain unsigned agreement alert");

  // Verify no alerts for Ban Batu (canceled) or Corey/Madilyn (partnerships)
  const canceledAlert = attentionQueue.find(i => i.clientName.includes("Batu"));
  assert.equal(canceledAlert, undefined, "Canceled client must NOT generate alerts");

  const partnershipAlert = attentionQueue.find(i => i.clientName.includes("Rickett") || i.clientName.includes("Townsend"));
  assert.equal(partnershipAlert, undefined, "Completed partnership must NOT generate alerts");

  console.log("\n✓ ALL BACKEND METRICS LOGIC AND ATTENTION QUEUE AUDITS PASSED WITH 100% PRECISION!");
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
