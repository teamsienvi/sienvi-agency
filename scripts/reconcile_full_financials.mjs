import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://jdodjbzypuiyhgrzuyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2RqYnp5cHVpeWhncnp1eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTU1NDQsImV4cCI6MjA5MDU3MTU0NH0.RmKcK7jJ5kbYQnJ_W_AFQF1lfYtdRUMfpwON-iPYBD0";

// Read password safely from .env.local
const env = fs.readFileSync(".env.local", "utf8");
const passLine = env.split("\n").find(l => l.startsWith("ADMIN_PASSWORD="));
const pass = passLine ? passLine.split("=")[1].trim() : "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "admin@sienvi.com",
    password: pass,
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    process.exit(1);
  }

  // 1. Fetch all client profiles
  const { data: clients, error: clientErr } = await supabase
    .from("client_profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (clientErr) {
    console.error("Client fetch error:", clientErr);
    process.exit(1);
  }

  // 2. Fetch all subscriptions
  const { data: subs, error: subsErr } = await supabase
    .from("client_subscriptions")
    .select("*")
    .order("created_at", { ascending: true });

  if (subsErr) {
    console.error("Subs fetch error:", subsErr);
    process.exit(1);
  }

  // 3. Fetch all one-time payments
  const { data: otps, error: otpErr } = await supabase
    .from("client_one_time_payments")
    .select("*")
    .order("created_at", { ascending: true });

  // 4. Fetch all contracts
  const { data: contracts, error: contractErr } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: true });

  console.log(`\n=== TOTAL RECORDS ===`);
  console.log(`Clients: ${clients?.length || 0}`);
  console.log(`Subscriptions: ${subs?.length || 0}`);
  console.log(`One-Time Payments: ${otps?.length || 0}`);
  console.log(`Contracts: ${contracts?.length || 0}`);

  console.log(`\n=== ONE-TIME PAYMENTS DETAIL ===`);
  otps?.forEach(o => {
    const cl = clients?.find(c => c.id === o.client_profile_id);
    console.log(`OTP ID: ${o.id}`);
    console.log(`  Client: ${cl?.first_name} ${cl?.last_name} (${cl?.email}) [ProfileID: ${o.client_profile_id}]`);
    console.log(`  Amount: $${o.amount} | Status: ${o.status} | Due: ${o.due_date} | Paid: ${o.paid_at}`);
    console.log(`  Description: ${o.description}`);
    console.log(`  Stripe Invoice ID: ${o.stripe_invoice_id || "none"}`);
  });

  console.log(`\n=== ALL SUBSCRIPTIONS DETAILED INVENTORY ===`);
  subs?.forEach((s, idx) => {
    const cl = clients?.find(c => c.id === s.client_profile_id);
    console.log(`\n[Sub #${idx + 1}] ID: ${s.id}`);
    console.log(`  Client: ${cl?.first_name} ${cl?.last_name} (${cl?.email})`);
    console.log(`  Profile Status: ${cl?.subscription_status}, Plan: ${cl?.plan}, CustomPrice: $${cl?.custom_price}`);
    console.log(`  Sub Label: "${s.label}"`);
    console.log(`  Sub Plan: ${s.plan} | Monthly: $${s.monthly_amount}`);
    console.log(`  Sub Status: ${s.subscription_status} | Primary: ${s.is_primary}`);
    console.log(`  Stripe Sub ID: ${s.stripe_subscription_id || "none"}`);
    console.log(`  Pricing Model: ${s.pricing_model || "none"}`);
    console.log(`  Contract Status: ${s.contract_status}`);
    console.log(`  Billing Day: ${s.billing_day} | Next Billing: ${s.next_billing_date}`);
  });

  console.log(`\n=== CLIENT AGGREGATION & BREAKDOWN ===`);
  let totalOperatingMRR = 0;
  let totalStripeMRR = 0;
  let totalManualMRR = 0;
  let totalPastDueMRR = 0;
  let totalPendingMRR = 0;
  let totalOneTimeOpen = 0;

  for (const c of clients || []) {
    const clientSubs = (subs || []).filter(s => s.client_profile_id === c.id);
    const clientOtps = (otps || []).filter(o => o.client_profile_id === c.id);
    const clientContracts = (contracts || []).filter(k => k.client_profile_id === c.id);

    const isPartnership = c.plan === "partnership" || c.plan === "nda" || c.is_partnership;
    const isCommission = c.pricing_model === "commission" || (c.email || "").includes("jordanellams") || (c.email || "").includes("michaelrrwilson");

    console.log(`\n--------------------------------------------------`);
    console.log(`Client: ${c.first_name} ${c.last_name} (${c.email})`);
    console.log(`  Profile ID: ${c.id}`);
    console.log(`  Plan: ${c.plan} | Status: ${c.subscription_status} | Active: ${c.is_active}`);
    console.log(`  Custom Price: $${c.custom_price}`);
    console.log(`  Stripe Cust: ${c.stripe_customer_id || "none"} | Sub: ${c.stripe_subscription_id || "none"}`);
    console.log(`  Classification: ${isPartnership ? "PARTNERSHIP/NDA" : isCommission ? "COMMISSION" : "CLIENT"}`);
    console.log(`  Subscriptions Count: ${clientSubs.length}`);

    clientSubs.forEach(s => {
      console.log(`    - Sub "${s.label}": $${s.monthly_amount}/mo | Status: ${s.subscription_status} | StripeSub: ${s.stripe_subscription_id || "none"}`);
    });

    clientOtps.forEach(o => {
      console.log(`    - OTP "${o.description}": $${o.amount} | Status: ${o.status} | Due: ${o.due_date}`);
    });
  }
}

run().catch(console.error);
