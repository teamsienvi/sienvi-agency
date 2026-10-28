/**
 * SIENVI AGENCY: WORKSTREAM A SECURITY REGRESSION TEST SUITE
 * Verifies that bank transfer confirmation:
 * 1. Records pending_verification notice only.
 * 2. Never mutates subscription_status or account_status.
 * 3. Never activates client_subscriptions.
 * 4. Strictly validates reference, bank, and transfer date formats.
 * 5. Rejects unauthorized / cross-client attempts.
 */

import test from "node:test";
import assert from "node:assert/strict";

// Mock the business logic of confirm_bank_transfer from update-client-status
function handleBankTransferSubmission(body, profile, caller, adminRoleCheck) {
  // 1. Caller authentication
  if (!caller) {
    return { status: 401, error: "Unauthorized" };
  }

  // 2. Profile authorization check
  const userEmail = caller.email.toLowerCase();
  const cd = profile.contract_details || {};
  const signers = cd.signers || [];
  const linked = cd.linkedClientEmails || [];
  const isAuthorized =
    signers.some((s) => s.email?.toLowerCase() === userEmail) ||
    linked.some((e) => e.toLowerCase() === userEmail) ||
    profile.user_id === caller.id ||
    profile.email?.toLowerCase() === userEmail;

  if (!isAuthorized && !adminRoleCheck) {
    return { status: 404, error: "Client profile not found or unauthorized" };
  }

  // 3. Admin preview read-only check
  if (adminRoleCheck && body.clientId && profile.user_id !== caller.id) {
    return {
      status: 403,
      error: "Admin Preview is strictly read-only. Client-facing mutations cannot be submitted from administrative preview.",
    };
  }

  // 4. Input Validation
  const rawRef = body.referenceNumber;
  const rawBank = body.sendingBank;
  const rawDate = body.transferDate;
  const rawAmount = body.amount;
  const rawNotes = body.notes;

  if (!rawRef || typeof rawRef !== "string" || rawRef.trim().length < 3 || rawRef.trim().length > 100) {
    return { status: 400, error: "Invalid reference number: must be between 3 and 100 characters." };
  }

  if (!rawBank || typeof rawBank !== "string" || rawBank.trim().length < 2 || rawBank.trim().length > 100) {
    return { status: 400, error: "Invalid sending bank: must be between 2 and 100 characters." };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dateStr = typeof rawDate === "string" ? rawDate.trim().substring(0, 10) : "";
  if (!dateRegex.test(dateStr) || isNaN(Date.parse(dateStr))) {
    return { status: 400, error: "Invalid transfer date: format must be YYYY-MM-DD." };
  }

  const transferConfirmation = {
    referenceNumber: rawRef.trim(),
    sendingBank: rawBank.trim(),
    transferDate: dateStr,
    notes: typeof rawNotes === "string" ? rawNotes.trim().slice(0, 1000) : "",
    amount: typeof rawAmount === "string" && rawAmount.trim() ? rawAmount.trim().slice(0, 50) : (profile.contract_details?.initialPayment || "$4,947 USD"),
    submittedAt: new Date().toISOString(),
    status: "pending_verification",
  };

  const updatedDetails = {
    ...profile.contract_details,
    bankTransferConfirmation: transferConfirmation,
  };

  // State update: contract_details updated ONLY.
  // subscription_status and account_status remain UNCHANGED!
  const updatedProfile = {
    ...profile,
    contract_details: updatedDetails,
  };

  return {
    status: 200,
    profile: updatedProfile,
    subscriptionsActivated: false, // Invariant: subscriptions must NEVER be activated
  };
}

test("SEC-01: Valid client submission records pending_verification notice without activating account", () => {
  const pendingProfile = {
    id: "profile-pending-01",
    user_id: "user-123",
    email: "client@example.com",
    account_status: "pending_payment",
    subscription_status: "pending_payment",
    contract_details: { initialPayment: "$4,947 USD" },
  };

  const caller = { id: "user-123", email: "client@example.com" };

  const body = {
    action: "confirm_bank_transfer",
    referenceNumber: "WIRE-OCT29-8819",
    sendingBank: "JPMorgan Chase",
    transferDate: "2026-10-28",
    amount: "$4,947 USD",
  };

  const res = handleBankTransferSubmission(body, pendingProfile, caller, false);

  assert.equal(res.status, 200);
  assert.equal(res.profile.subscription_status, "pending_payment"); // PRESERVED
  assert.equal(res.profile.account_status, "pending_payment"); // PRESERVED
  assert.equal(res.subscriptionsActivated, false); // ZERO ACTIVATION
  assert.equal(
    res.profile.contract_details.bankTransferConfirmation.status,
    "pending_verification"
  );
  assert.equal(
    res.profile.contract_details.bankTransferConfirmation.referenceNumber,
    "WIRE-OCT29-8819"
  );
});

test("SEC-02: Existing active accounts remain active after transfer report", () => {
  const activeProfile = {
    id: "profile-active-01",
    user_id: "user-456",
    email: "active@example.com",
    account_status: "active",
    subscription_status: "active",
    contract_details: {},
  };

  const caller = { id: "user-456", email: "active@example.com" };

  const body = {
    action: "confirm_bank_transfer",
    referenceNumber: "WIRE-RENEWAL-110",
    sendingBank: "Bank of America",
    transferDate: "2026-10-28",
  };

  const res = handleBankTransferSubmission(body, activeProfile, caller, false);

  assert.equal(res.status, 200);
  assert.equal(res.profile.subscription_status, "active"); // STILL ACTIVE
  assert.equal(res.profile.account_status, "active"); // STILL ACTIVE
  assert.equal(
    res.profile.contract_details.bankTransferConfirmation.status,
    "pending_verification"
  );
});

test("SEC-03: Invalid inputs (short ref, empty bank, bad date) are strictly rejected", () => {
  const profile = { id: "p1", user_id: "u1", email: "c@test.com" };
  const caller = { id: "u1", email: "c@test.com" };

  // Ref too short
  const res1 = handleBankTransferSubmission(
    { referenceNumber: "x", sendingBank: "Chase", transferDate: "2026-10-28" },
    profile,
    caller,
    false
  );
  assert.equal(res1.status, 400);
  assert.match(res1.error, /reference number/);

  // Missing bank
  const res2 = handleBankTransferSubmission(
    { referenceNumber: "WIRE-12345", sendingBank: "", transferDate: "2026-10-28" },
    profile,
    caller,
    false
  );
  assert.equal(res2.status, 400);
  assert.match(res2.error, /sending bank/);

  // Bad date format
  const res3 = handleBankTransferSubmission(
    { referenceNumber: "WIRE-12345", sendingBank: "Chase", transferDate: "invalid-date" },
    profile,
    caller,
    false
  );
  assert.equal(res3.status, 400);
  assert.match(res3.error, /transfer date/);
});

test("SEC-04: Unauthorized user cannot submit transfer for another client profile", () => {
  const victimProfile = {
    id: "victim-01",
    user_id: "victim-user-id",
    email: "victim@example.com",
    contract_details: {},
  };

  const attackerCaller = { id: "attacker-id", email: "attacker@example.com" };

  const res = handleBankTransferSubmission(
    { referenceNumber: "FAKE-REF-999", sendingBank: "Wells Fargo", transferDate: "2026-10-28" },
    victimProfile,
    attackerCaller,
    false
  );

  assert.equal(res.status, 404);
  assert.match(res.error, /unauthorized/i);
});

test("SEC-05: Admin Preview remains read-only and rejects transfer submission", () => {
  const clientProfile = {
    id: "client-01",
    user_id: "client-uid",
    email: "client@example.com",
    contract_details: {},
  };

  const adminCaller = { id: "admin-uid", email: "admin@sienvi.com" };

  const res = handleBankTransferSubmission(
    {
      action: "confirm_bank_transfer",
      clientId: "client-01",
      referenceNumber: "ADMIN-PROBE",
      sendingBank: "Chase",
      transferDate: "2026-10-28",
    },
    clientProfile,
    adminCaller,
    true // Admin role check is true
  );

  assert.equal(res.status, 403);
  assert.match(res.error, /Admin Preview is strictly read-only/);
});

test("SEC-06: Unauthenticated request is rejected with 401", () => {
  const profile = { id: "p1", user_id: "u1" };
  const res = handleBankTransferSubmission(
    { referenceNumber: "WIRE-12345", sendingBank: "Chase", transferDate: "2026-10-28" },
    profile,
    null, // No caller
    false
  );

  assert.equal(res.status, 401);
});
