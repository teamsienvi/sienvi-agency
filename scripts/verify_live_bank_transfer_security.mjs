import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import fs from "fs";
import assert from "node:assert/strict";

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

async function verifyLiveBankTransferSecurity() {
  console.log("=== VERIFYING LIVE BANK TRANSFER SECURITY GATE (update-client-status) ===");

  const testEmail = `probe.test.${Date.now()}@sienvi-test.com`;

  // 1. Create isolated test user & profile
  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: "TempTestPassword!2026",
    email_confirm: true,
  });
  assert.ifError(authErr);
  const userId = authUser.user.id;

  const { data: profile, error: profErr } = await supabaseAdmin
    .from("client_profiles")
    .insert({
      first_name: "Security Probe",
      last_name: "Corp",
      email: testEmail,
      user_id: userId,
      account_status: "pending_payment",
      subscription_status: "pending_payment",
      contract_details: { initialPayment: "$4,947 USD" },
    })
    .select()
    .single();
  assert.ifError(profErr);

  console.log(`Created isolated test profile ${profile.id} with status: ${profile.account_status}`);

  try {
    // 2. Generate auth token for test user
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: testEmail,
    });
    assert.ifError(linkErr);

    // Call update-client-status via Supabase Functions invoke with service/admin context or direct token
    // Let's call the function endpoint with test user's token
    // We can exchange the token or sign in with password
    const anonClient = createClient(SUPABASE_URL, getApiKeys().anonKey);
    const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: "TempTestPassword!2026",
    });
    assert.ifError(signInErr);
    const userToken = sessionData.session.access_token;

    console.log("Submitting bank transfer confirmation as authenticated test client...");
    const res = await fetch(`${SUPABASE_URL}/functions/v1/update-client-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        action: "confirm_bank_transfer",
        referenceNumber: "PROBE-LIVE-TEST-001",
        sendingBank: "Silicon Valley Bank",
        transferDate: "2026-10-28",
        amount: "$4,947 USD",
        notes: "Live non-destructive verification probe",
      }),
    });

    const resJson = await res.json();
    console.log(`Edge function response (${res.status}):`, resJson);
    assert.equal(res.status, 200, "Must return 200 OK");

    // 3. Inspect updated database state
    const { data: updatedProfile, error: getErr } = await supabaseAdmin
      .from("client_profiles")
      .select("*")
      .eq("id", profile.id)
      .single();
    assert.ifError(getErr);

    console.log("\nPost-Submission Invariant Audit:");
    console.log(`- account_status:      ${updatedProfile.account_status} (Expected: pending_payment)`);
    console.log(`- subscription_status: ${updatedProfile.subscription_status} (Expected: pending_payment)`);
    console.log(`- transfer status:     ${updatedProfile.contract_details?.bankTransferConfirmation?.status} (Expected: pending_verification)`);

    assert.equal(updatedProfile.account_status, "pending_payment", "account_status MUST remain pending_payment");
    assert.equal(updatedProfile.subscription_status, "pending_payment", "subscription_status MUST remain pending_payment");
    assert.equal(
      updatedProfile.contract_details?.bankTransferConfirmation?.status,
      "pending_verification",
      "Notice status must be pending_verification"
    );

    console.log("\n>>> LIVE BANK TRANSFER VERIFICATION GATE CONFIRMED SECURE IN PRODUCTION!");

  } finally {
    // Clean up isolated test records immediately
    await supabaseAdmin.from("client_profiles").delete().eq("id", profile.id);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.log("Cleaned up isolated test user & profile.");
  }
}

verifyLiveBankTransferSecurity().catch((err) => {
  console.error("FATAL ERROR IN LIVE VERIFICATION:", err);
  process.exit(1);
});
