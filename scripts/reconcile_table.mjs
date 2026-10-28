import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://jdodjbzypuiyhgrzuyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2RqYnp5cHVpeWhncnp1eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTU1NDQsImV4cCI6MjA5MDU3MTU0NH0.RmKcK7jJ5kbYQnJ_W_AFQF1lfYtdRUMfpwON-iPYBD0";

const env = fs.readFileSync(".env.local", "utf8");
const passLine = env.split("\n").find(l => l.startsWith("ADMIN_PASSWORD="));
const pass = passLine ? passLine.split("=")[1].trim() : "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  await supabase.auth.signInWithPassword({ email: "admin@sienvi.com", password: pass });
  const { data: subs } = await supabase
    .from("client_subscriptions")
    .select("id, client_profile_id, label, monthly_amount, subscription_status, stripe_subscription_id, stripe_customer_id, notes, billing_day, created_at, client_profiles(email, first_name, last_name, plan)")
    .order("created_at", { ascending: true });

  const rows = subs.map((s, idx) => ({
    idx: idx + 1,
    id: s.id.substring(0, 8),
    client: `${s.client_profiles?.first_name || ""} ${s.client_profiles?.last_name || ""}`.trim() || s.client_profiles?.email,
    email: s.client_profiles?.email,
    label: s.label,
    amount: s.monthly_amount,
    status: s.subscription_status,
    stripeSub: s.stripe_subscription_id ? s.stripe_subscription_id : "NONE",
    notes: s.notes || ""
  }));

  console.table(rows);
}

run().catch(console.error);
