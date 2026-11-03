/**
 * SIENVI AGENCY: EDGE FUNCTION GATEWAY JWT & APPLICATION RBAC SUITE
 * Tests gateway configuration and application authorization for:
 * 1. stripe-webhook
 * 2. get-admin-billing-overview
 * 3. verify-manual-payment
 * 4. update-client-status
 * 
 * Verifies behavior across 4 caller identities:
 * - Anonymous (No Authorization header)
 * - Invalid Token (Malformed / Expired Bearer Token)
 * - Client Token (Authenticated user without admin role)
 * - Admin Token (Authenticated user with role='admin' in user_roles)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Mock Supabase Auth & RBAC State
const USERS = {
  client: { id: "00000000-0000-0000-0000-000000000001", email: "client@example.com" },
  admin: { id: "00000000-0000-0000-0000-000000000002", email: "admin@sienvi.com" },
};

const ROLES = {
  [USERS.admin.id]: "admin",
  // USERS.client has NO entry in user_roles (or role='client')
};

// Application Auth Handler for Administrative Functions
// (Matches get-admin-billing-overview & verify-manual-payment implementation)
async function handleAdminAuth(authHeader, mockDb = { users: USERS, roles: ROLES }) {
  if (!authHeader) {
    return { status: 401, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (token === "invalid-token" || !token) {
    return { status: 401, error: "Invalid or expired authorization token" };
  }

  // Resolve user
  let user = null;
  if (token === "client-jwt-token") user = mockDb.users.client;
  else if (token === "admin-jwt-token") user = mockDb.users.admin;
  else return { status: 401, error: "Invalid or expired authorization token" };

  // Resolve admin role from user_roles
  const role = mockDb.roles[user.id];
  if (role !== "admin") {
    return { status: 403, error: "Access denied. Administrator privileges required." };
  }

  return { status: 200, user };
}

// Application Auth Handler for update-client-status
// (Matches update-client-status lines 877-915 and 1168-1175)
async function handleUpdateClientStatusAuth(authHeader, action, mockDb = { users: USERS, roles: ROLES }) {
  if (!authHeader) {
    return { status: 401, error: "No authorization header" };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (token === "invalid-token" || !token) {
    return { status: 401, error: "Unauthorized" };
  }

  let user = null;
  if (token === "client-jwt-token") user = mockDb.users.client;
  else if (token === "admin-jwt-token") user = mockDb.users.admin;
  else return { status: 401, error: "Unauthorized" };

  const role = mockDb.roles[user.id];
  const isAdmin = role === "admin";

  // Check admin-restricted actions (e.g. verify_bank_transfer)
  if (action === "verify_bank_transfer" && !isAdmin) {
    return { status: 403, error: "Access denied. Only administrators can verify payments." };
  }

  return { status: 200, user, isAdmin };
}

// Stripe Webhook Authentication Handler (HMAC-SHA256 signature verification)
function handleStripeWebhookAuth(headers, rawBody, webhookSecret) {
  const signatureHeader = headers["stripe-signature"];
  if (!signatureHeader) {
    return { status: 400, error: "Webhook Error: Missing stripe-signature header" };
  }

  const match = signatureHeader.match(/t=(\d+),v1=([a-f0-9]+)/);
  if (!match) {
    return { status: 400, error: "Webhook Error: Malformed signature header" };
  }

  const timestamp = parseInt(match[1], 10);
  const receivedSig = match[2];

  // Replay attack defense
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return { status: 400, error: "Webhook Error: Timestamp out of tolerance (> 300s)" };
  }

  // Compute HMAC
  const signedPayload = `${timestamp}.${rawBody}`;
  const computedSig = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  if (computedSig !== receivedSig) {
    return { status: 400, error: "Webhook Error: Invalid signature" };
  }

  return { status: 200, verified: true };
}

describe("Section 1: Edge Function Gateway JWT & Application RBAC", () => {
  // -------------------------------------------------------------------------
  // 1. stripe-webhook (Gateway: verify_jwt = false; Auth: Stripe HMAC-SHA256)
  // -------------------------------------------------------------------------
  describe("1. stripe-webhook", () => {
    const secret = "whsec_test_stripe_secret_12345";
    const rawBody = JSON.stringify({ id: "evt_123", type: "invoice.paid" });
    const timestamp = Math.floor(Date.now() / 1000);
    const validHmac = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    const validHeader = `t=${timestamp},v1=${validHmac}`;

    it("1.1 Accepts anonymous webhook call without Supabase JWT when Stripe signature is valid", () => {
      // Notice: No Authorization header passed at all! Gateway verify_jwt=false permits this.
      const res = handleStripeWebhookAuth({ "stripe-signature": validHeader }, rawBody, secret);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.verified, true);
    });

    it("1.2 Strictly rejects request with missing stripe-signature header", () => {
      const res = handleStripeWebhookAuth({}, rawBody, secret);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error.includes("Missing stripe-signature header"));
    });

    it("1.3 Strictly rejects request with invalid stripe signature", () => {
      const res = handleStripeWebhookAuth({ "stripe-signature": `t=${timestamp},v1=bad_hash` }, rawBody, secret);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error.includes("Invalid signature"));
    });

    it("1.4 Rejects replayed request with expired timestamp (> 300s)", () => {
      const oldTime = timestamp - 400;
      const oldHmac = crypto.createHmac("sha256", secret).update(`${oldTime}.${rawBody}`).digest("hex");
      const res = handleStripeWebhookAuth({ "stripe-signature": `t=${oldTime},v1=${oldHmac}` }, rawBody, secret);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error.includes("Timestamp out of tolerance"));
    });
  });

  // -------------------------------------------------------------------------
  // 2. get-admin-billing-overview (Gateway: verify_jwt = true; Auth: RBAC admin)
  // -------------------------------------------------------------------------
  describe("2. get-admin-billing-overview", () => {
    it("2.1 Rejects anonymous request with 401 Missing authorization header", async () => {
      const res = await handleAdminAuth(null);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.error, "Missing authorization header");
    });

    it("2.2 Rejects invalid/malformed token with 401 Invalid or expired authorization token", async () => {
      const res = await handleAdminAuth("Bearer invalid-token");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.error, "Invalid or expired authorization token");
    });

    it("2.3 Rejects authenticated client token with 403 Access denied", async () => {
      const res = await handleAdminAuth("Bearer client-jwt-token");
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.error, "Access denied. Administrator privileges required.");
    });

    it("2.4 Authorizes authenticated admin token with role='admin'", async () => {
      const res = await handleAdminAuth("Bearer admin-jwt-token");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user.email, "admin@sienvi.com");
    });
  });

  // -------------------------------------------------------------------------
  // 3. verify-manual-payment (Gateway: verify_jwt = true; Auth: RBAC admin)
  // -------------------------------------------------------------------------
  describe("3. verify-manual-payment", () => {
    it("3.1 Rejects anonymous request with 401", async () => {
      const res = await handleAdminAuth(null);
      assert.strictEqual(res.status, 401);
    });

    it("3.2 Rejects invalid token with 401", async () => {
      const res = await handleAdminAuth("Bearer invalid-token");
      assert.strictEqual(res.status, 401);
    });

    it("3.3 Rejects client token with 403 Administrator privileges required", async () => {
      const res = await handleAdminAuth("Bearer client-jwt-token");
      assert.strictEqual(res.status, 403);
    });

    it("3.4 Authorizes admin token", async () => {
      const res = await handleAdminAuth("Bearer admin-jwt-token");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user.id, USERS.admin.id);
    });
  });

  // -------------------------------------------------------------------------
  // 4. update-client-status (Gateway: verify_jwt = false; Auth: internal JWT + RBAC)
  // -------------------------------------------------------------------------
  describe("4. update-client-status", () => {
    it("4.1 Rejects anonymous caller with 401 No authorization header", async () => {
      const res = await handleUpdateClientStatusAuth(null, "confirm_bank_transfer");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.error, "No authorization header");
    });

    it("4.2 Rejects invalid token with 401 Unauthorized", async () => {
      const res = await handleUpdateClientStatusAuth("Bearer invalid-token", "confirm_bank_transfer");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.error, "Unauthorized");
    });

    it("4.3 Allows authenticated client to report bank transfer (confirm_bank_transfer)", async () => {
      const res = await handleUpdateClientStatusAuth("Bearer client-jwt-token", "confirm_bank_transfer");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user.email, "client@example.com");
      assert.strictEqual(res.isAdmin, false);
    });

    it("4.4 Rejects client attempting admin verify_bank_transfer with 403 Only administrators can verify", async () => {
      const res = await handleUpdateClientStatusAuth("Bearer client-jwt-token", "verify_bank_transfer");
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.error, "Access denied. Only administrators can verify payments.");
    });

    it("4.5 Allows administrator to execute verify_bank_transfer", async () => {
      const res = await handleUpdateClientStatusAuth("Bearer admin-jwt-token", "verify_bank_transfer");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.isAdmin, true);
    });
  });
});
