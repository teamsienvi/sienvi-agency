import assert from "node:assert/strict";

/**
 * Pure domain logic for Sienvi Financial Aggregation
 * Used by get-admin-executive-metrics edge function and verified by automated unit tests.
 */
export function calculateExecutiveFinancials({ clients, subscriptions, oneTimePayments }) {
  let operatingMrr = 0;
  let stripeMrr = 0;
  let manualMrr = 0;
  let pastDueMrr = 0;
  let pendingMrr = 0;
  let openInvoicesTotal = 0;
  let pastDueInvoicesTotal = 0;

  const now = new Date();

  // Map subscriptions by client
  const clientSubsMap = new Map();
  for (const s of subscriptions) {
    if (!clientSubsMap.has(s.client_profile_id)) {
      clientSubsMap.set(s.client_profile_id, []);
    }
    clientSubsMap.get(s.client_profile_id).push(s);
  }

  // Active revenue breakdown
  const activeSubscriptionsBreakdown = [];
  const pastDueSubscriptionsBreakdown = [];
  const pendingSubscriptionsBreakdown = [];

  for (const s of subscriptions) {
    const client = clients.find(c => c.id === s.client_profile_id);
    const isPartnership = client?.plan === "partnership" || client?.plan === "nda" || client?.is_partnership;
    const isCommissionOnly = client?.pricing_model === "commission" || s.pricing_model === "commission";

    // Skip partnerships or zero-dollar commission agreements from flat MRR
    if (isPartnership || (isCommissionOnly && s.monthly_amount === 0)) {
      continue;
    }

    const amount = Number(s.monthly_amount) || 0;
    const hasStripeSub = Boolean(s.stripe_subscription_id && s.stripe_subscription_id.startsWith("sub_"));

    if (s.subscription_status === "active") {
      operatingMrr += amount;
      if (hasStripeSub) {
        stripeMrr += amount;
      } else {
        manualMrr += amount;
      }
      activeSubscriptionsBreakdown.push({
        id: s.id,
        clientId: s.client_profile_id,
        clientName: client ? `${client.first_name || ""} ${client.last_name || ""}`.trim() : "Unknown",
        label: s.label,
        amount,
        channel: hasStripeSub ? "stripe_automated" : "manual_retainer",
        billingDay: s.billing_day,
      });
    } else if (s.subscription_status === "past_due") {
      pastDueMrr += amount;
      pastDueSubscriptionsBreakdown.push({
        id: s.id,
        clientId: s.client_profile_id,
        clientName: client ? `${client.first_name || ""} ${client.last_name || ""}`.trim() : "Unknown",
        label: s.label,
        amount,
        channel: hasStripeSub ? "stripe_automated" : "manual_retainer",
        nextBillingDate: s.next_billing_date,
      });
    } else if (s.subscription_status === "pending_payment") {
      pendingMrr += amount;
      pendingSubscriptionsBreakdown.push({
        id: s.id,
        clientId: s.client_profile_id,
        clientName: client ? `${client.first_name || ""} ${client.last_name || ""}`.trim() : "Unknown",
        label: s.label,
        amount,
        channel: hasStripeSub ? "stripe_automated" : "manual_retainer",
      });
    }
  }

  // One-time invoices
  const overdueInvoices = [];
  for (const otp of oneTimePayments || []) {
    if (otp.status === "open") {
      const amt = Number(otp.amount) || 0;
      openInvoicesTotal += amt;

      const isOverdue = otp.due_date ? new Date(otp.due_date) < now : false;
      if (isOverdue) {
        pastDueInvoicesTotal += amt;
        overdueInvoices.push(otp);
      }
    }
  }

  // Client counts
  const clientCounts = {
    total: clients.length,
    active: clients.filter(c => c.subscription_status === "active" && c.plan !== "partnership" && c.plan !== "nda").length,
    pastDue: clients.filter(c => c.subscription_status === "past_due").length,
    pending: clients.filter(c => c.subscription_status === "pending_payment").length,
    partnership: clients.filter(c => c.plan === "partnership" || c.plan === "nda").length,
    canceled: clients.filter(c => c.subscription_status === "canceled").length,
  };

  return {
    operatingMrr,
    stripeMrr,
    manualMrr,
    pastDueMrr,
    pendingMrr,
    openInvoicesTotal,
    pastDueInvoicesTotal,
    activeSubscriptionsCount: activeSubscriptionsBreakdown.length,
    activeSubscriptionsBreakdown,
    pastDueSubscriptionsBreakdown,
    pendingSubscriptionsBreakdown,
    overdueInvoices,
    clientCounts,
    collectedRevenue: {
      status: "reconciliation_pending",
      value: null,
      message: "Collected payment settlement ledger is managed in Stripe. Historical charges not mirrored in local database.",
    },
  };
}

// ---------------- AUTOMATED REGRESSION TESTS ----------------
async function runTests() {
  console.log("Running Sienvi Financial Domain Logic Regression Tests...");

  // Test 1: Baseline exact reconciliation matching Sienvi October 2026 data
  const mockClients = [
    { id: "c1", first_name: "Timothy", last_name: "Montgomery", email: "tim@example.com", plan: "custom", subscription_status: "active" },
    { id: "c2", first_name: "Sihara", last_name: "Prak", email: "sihara@example.com", plan: "custom", subscription_status: "active" },
    { id: "c3", first_name: "Sam", last_name: "Roberts", email: "sam@hairtamin.com", plan: "custom", subscription_status: "active" },
    { id: "c4", first_name: "Guillermo", last_name: "Carillo", email: "gcq1@me.com", plan: "custom", subscription_status: "active" },
    { id: "c5", first_name: "Billie", last_name: "Sue", email: "billie@example.com", plan: "custom", subscription_status: "active" },
    { id: "c6", first_name: "Rick", last_name: "Anderson", email: "rick@example.com", plan: "custom", subscription_status: "active" },
    { id: "c7", first_name: "George", last_name: "Fahmy", email: "george@example.com", plan: "custom", subscription_status: "active" },
    { id: "c8", first_name: "Pamela", last_name: "Noel", email: "pamela@example.com", plan: "custom", subscription_status: "active" },
    { id: "c9", first_name: "Jordan", last_name: "Ellams", email: "jordan@example.com", plan: "custom", subscription_status: "active", pricing_model: "commission" },
    { id: "c10", first_name: "Susie", last_name: "Oh", email: "susie@example.com", plan: "custom", subscription_status: "past_due" },
    { id: "c11", first_name: "Devra", last_name: "Henderson", email: "devra@example.com", plan: "custom", subscription_status: "pending_payment" },
    { id: "c12", first_name: "Ban", last_name: "Batu", email: "ban@example.com", plan: "amazon", subscription_status: "canceled" },
    { id: "c13", first_name: "Corey", last_name: "Rickett", email: "corey@example.com", plan: "partnership", subscription_status: "active" },
    { id: "c14", first_name: "Madilyn", last_name: "Townsend", email: "maddie@example.com", plan: "partnership", subscription_status: "active" },
    { id: "c15", first_name: "Michael", last_name: "Wilson", email: "mike@example.com", plan: "custom", subscription_status: "active", pricing_model: "commission" },
    { id: "c16", first_name: "Shane", last_name: "Powhatan", email: "shane@example.com", plan: "prospect", subscription_status: "pending_payment" },
  ];

  const mockSubs = [
    // Timothy (3 subs, all Stripe active)
    { id: "s1", client_profile_id: "c1", label: "Social Media Suite", monthly_amount: 2395, subscription_status: "active", stripe_subscription_id: "sub_1U4QV5Dnw1azoLSpGgNreI75", billing_day: 1 },
    { id: "s2", client_profile_id: "c1", label: "Website Maintenance", monthly_amount: 1605, subscription_status: "active", stripe_subscription_id: "sub_1UJKtEDnw1azoLSplkEvxlif", billing_day: 1 },
    { id: "s3", client_profile_id: "c1", label: "B2B Revenue Pipeline", monthly_amount: 399, subscription_status: "active", stripe_subscription_id: "sub_1UJKtHDnw1azoLSpX0lMdLFD", billing_day: 1 },
    // Sihara (Stripe active)
    { id: "s4", client_profile_id: "c2", label: "Custom Automation", monthly_amount: 3450, subscription_status: "active", stripe_subscription_id: "sub_1U9PkDDnw1azoLSp9knHlV4E", billing_day: 5 },
    // Sam Roberts (Stripe active)
    { id: "s5", client_profile_id: "c3", label: "SEO/AEO Suite", monthly_amount: 1950, subscription_status: "active", stripe_subscription_id: "sub_1U3JiNDnw1azoLSpkIk6ywU4", billing_day: 12 },
    // Guillermo (Stripe active)
    { id: "s6", client_profile_id: "c4", label: "Custom GPT", monthly_amount: 999, subscription_status: "active", stripe_subscription_id: "sub_1TUTE1Dnw1azoLSp26LcGmPS", billing_day: 7 },
    // Billie Sue (Manual active)
    { id: "s7", client_profile_id: "c5", label: "Custom Tool", monthly_amount: 888, subscription_status: "active", stripe_subscription_id: null, billing_day: 13 },
    // Rick Anderson (Manual active)
    { id: "s8", client_profile_id: "c6", label: "Custom Website", monthly_amount: 1100, subscription_status: "active", stripe_subscription_id: null, billing_day: 10 },
    // George Fahmy (Sub 1 Active Stripe $500, Sub 2 Pending Payment $500)
    { id: "s9", client_profile_id: "c7", label: "Amazon Ads - 1st Installment", monthly_amount: 500, subscription_status: "active", stripe_subscription_id: "sub_1UQe7fDnw1azoLSpaeISVf6u", billing_day: 15 },
    { id: "s10", client_profile_id: "c7", label: "Amazon Ads - 2nd Installment", monthly_amount: 500, subscription_status: "pending_payment", stripe_subscription_id: null, billing_day: 30 },
    // Pamela Noel (Manual active ACH/Wire)
    { id: "s11", client_profile_id: "c8", label: "Commercial Launch", monthly_amount: 2497, subscription_status: "active", stripe_subscription_id: null, billing_day: 19 },
    // Jordan Ellams (Commission $0)
    { id: "s12", client_profile_id: "c9", label: "Custom Data Dashboard", monthly_amount: 0, subscription_status: "active", stripe_subscription_id: null, pricing_model: "commission" },
    // Susie Oh (Stripe Past Due)
    { id: "s13", client_profile_id: "c10", label: "Social Media & Ads", monthly_amount: 2450, subscription_status: "past_due", stripe_subscription_id: "sub_1Tnk9nDnw1azoLSpNnULqVri", next_billing_date: "2026-09-24" },
  ];

  const mockOtps = [
    // Timothy Montgomery open past-due invoice
    { id: "otp1", client_profile_id: "c1", amount: 999, status: "open", due_date: "2026-10-27T20:00:38Z", description: "Amazon Design Package" },
  ];

  const results = calculateExecutiveFinancials({
    clients: mockClients,
    subscriptions: mockSubs,
    oneTimePayments: mockOtps,
  });

  // Assertions
  assert.equal(results.operatingMrr, 15783, "Operating MRR must be exactly $15,783.00");
  assert.equal(results.stripeMrr, 11298, "Stripe MRR must be exactly $11,298.00");
  assert.equal(results.manualMrr, 4485, "Manual MRR must be exactly $4,485.00");
  assert.equal(results.operatingMrr, results.stripeMrr + results.manualMrr, "Operating MRR must equal Stripe MRR + Manual MRR");
  
  assert.equal(results.pastDueMrr, 2450, "Past-due MRR must be $2,450.00 (Susie Oh)");
  assert.equal(results.pendingMrr, 500, "Pending MRR must be $500.00 (George Fahmy 2nd Installment)");
  assert.equal(results.openInvoicesTotal, 999, "Open Invoices total must be $999.00 (Timothy Montgomery)");
  assert.equal(results.pastDueInvoicesTotal, 999, "Past Due Invoices total must be $999.00 (Timothy Montgomery)");
  assert.equal(results.activeSubscriptionsCount, 10, "There must be 10 revenue-generating active subscriptions");
  assert.equal(results.collectedRevenue.status, "reconciliation_pending", "Collected Revenue status must be reconciliation_pending");
  assert.equal(results.collectedRevenue.value, null, "Collected Revenue value must be null rather than false $0.00");

  console.log("✓ Test 1 Passed: Sienvi October 2026 baseline verified.");

  // Test 2: Multi-subscription client aggregation (Timothy Montgomery)
  const timSubs = results.activeSubscriptionsBreakdown.filter(s => s.clientId === "c1");
  assert.equal(timSubs.length, 3, "Timothy must have 3 active subscriptions");
  const timTotal = timSubs.reduce((acc, s) => acc + s.amount, 0);
  assert.equal(timTotal, 4399, "Timothy's combined subscription total must be $4,399.00");
  console.log("✓ Test 2 Passed: Multi-subscription client aggregation verified.");

  // Test 3: George Fahmy Installment Split
  const gfActive = results.activeSubscriptionsBreakdown.find(s => s.clientId === "c7");
  const gfPending = results.pendingSubscriptionsBreakdown.find(s => s.clientId === "c7");
  assert.ok(gfActive, "George Fahmy active installment exists");
  assert.equal(gfActive.amount, 500, "George Fahmy active installment is $500");
  assert.equal(gfActive.channel, "stripe_automated", "George Fahmy 1st installment is automated via Stripe");
  assert.ok(gfPending, "George Fahmy pending installment exists");
  assert.equal(gfPending.amount, 500, "George Fahmy pending installment is $500");
  assert.equal(gfPending.channel, "manual_retainer", "George Fahmy 2nd installment is pending payment");
  console.log("✓ Test 3 Passed: Installment split handling verified.");

  // Test 4: Commission-based clients and Partnerships exclusion from flat MRR
  const jordanActive = results.activeSubscriptionsBreakdown.find(s => s.clientId === "c9");
  assert.equal(jordanActive, undefined, "Jordan Ellams $0 commission agreement must not be added to active MRR breakdown");
  const coreyActive = results.activeSubscriptionsBreakdown.find(s => s.clientId === "c13");
  assert.equal(coreyActive, undefined, "Partnership agreements must not be added to MRR breakdown");
  console.log("✓ Test 4 Passed: Commission and Partnership zero-MRR exclusions verified.");

  // Test 5: Overdue invoice detection
  assert.equal(results.overdueInvoices.length, 1, "Exactly 1 overdue invoice detected");
  assert.equal(results.overdueInvoices[0].amount, 999, "Overdue invoice amount is $999");
  assert.equal(results.overdueInvoices[0].client_profile_id, "c1", "Overdue invoice belongs to Timothy Montgomery");
  console.log("✓ Test 5 Passed: Overdue invoice detection verified.");

  console.log("\nALL 5 FINANCIAL REGRESSION TESTS PASSED CLEANLY!");
}

runTests().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
