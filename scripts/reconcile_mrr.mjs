import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jdodjbzypuiyhgrzuyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2RqYnp5cHVpeWhncnp1eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTU1NDQsImV4cCI6MjA5MDU3MTU0NH0.RmKcK7jJ5kbYQnJ_W_AFQF1lfYtdRUMfpwON-iPYBD0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@sienvi.com",
    password: "SienviAdmin2024!",
  });

  if (authError || !authData.session) {
    console.error("Auth failed:", authError);
    process.exit(1);
  }

  const token = authData.session.access_token;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-admin-clients`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Failed to invoke get-admin-clients:", res.status, await res.text());
    process.exit(1);
  }

  const json = await res.json();
  const clients = json.clients || [];

  console.log(`Total clients returned: ${clients.length}`);

  const planPrices = {
    single: 888,
    triple: 2398.2,
    full: 3996,
    amazon: 999,
  };

  let legacyDashboardRevenue = 0;
  let clientDirectoryTotal = 0;

  console.log("\n================ CLIENT-BY-CLIENT BREAKDOWN ================");
  clients.forEach((c, idx) => {
    const hasSubs = c.subscriptions && c.subscriptions.length > 0;
    const isPartnership = c.plan === "partnership" || c.plan === "nda" || c.contractDetails?.relationshipType === "partnership";
    const isCommission = (c.email || "").includes("jordanellams") || (c.email || "").includes("michaelrrwilson") || c.contractDetails?.pricingModel === "commission";
    
    let legacyContribution = 0;
    if (c.subscriptionStatus === "active" && c.isActive) {
      if (c.plan === "custom" && c.customPrice) {
        legacyContribution = c.customPrice;
      } else {
        legacyContribution = planPrices[c.plan] || 0;
      }
    }
    legacyDashboardRevenue += legacyContribution;

    let clientSubsSum = 0;
    if (hasSubs) {
      clientSubsSum = c.subscriptions.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0);
    } else {
      clientSubsSum = c.customPrice || planPrices[c.plan] || 0;
    }
    if (isPartnership) clientSubsSum = 0;
    if (isCommission) clientSubsSum = 0;
    if (c.subscriptionStatus === "canceled") clientSubsSum = 0;

    clientDirectoryTotal += clientSubsSum;

    console.log(`\n[${idx + 1}] ${c.clientName || c.email}`);
    console.log(`    Plan: ${c.plan} | Status: ${c.subscriptionStatus} | Active: ${c.isActive}`);
    console.log(`    Stripe Customer: ${c.stripeCustomerId || "none"} | SubId: ${c.stripeSubscriptionId || "none"}`);
    console.log(`    Custom Price: $${c.customPrice} | Legacy Dashboard Contribution: $${legacyContribution}`);
    console.log(`    Subscriptions Count: ${c.subscriptions?.length || 0}`);
    if (hasSubs) {
      c.subscriptions.forEach((s, sIdx) => {
        console.log(`      Sub ${sIdx + 1}: "${s.label}" - $${s.monthlyAmount}/mo (Status: ${s.subscriptionStatus}, StripeSub: ${s.stripeSubscriptionId || "none"})`);
      });
    }
    console.log(`    Client Aggregated Retainer: $${clientSubsSum}`);
  });

  console.log("\n================ SUMMARY COMPARISON ================");
  console.log(`Legacy AdminDashboard Calculation: $${legacyDashboardRevenue.toFixed(2)}`);
  console.log(`Full Multi-Subscription Sum:       $${clientDirectoryTotal.toFixed(2)}`);
  console.log(`Difference:                        $${(clientDirectoryTotal - legacyDashboardRevenue).toFixed(2)}`);
}

main().catch(console.error);
