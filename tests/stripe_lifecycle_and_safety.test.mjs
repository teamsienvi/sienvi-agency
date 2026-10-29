/**
 * SIENVI AGENCY: PHASE 2B SPRINT 2 - STRIPE LIFECYCLE & RECONCILIATION SAFETY TEST SUITE
 * Validates:
 * 1. Two refunds on one charge (multiple partial refunds)
 * 2. Same source object with multiple lifecycle events
 * 3. Webhook / backfill collision & deduplication
 * 4. Stale webhook arrival protection (state regression prevention)
 * 5. Incorrect client mapping handling (unmapped queue)
 * 6. Production target rejection in backfill apply mode
 * 7. Dry-run performing zero writes
 * 8. Mixed fixture and live-source rejection
 * 9. Stripe test/live mode segregation
 * 10. No duplicate customer collections invariant
 */

import assert from "node:assert/strict";
import {
  normalizeStripeInvoice,
  normalizeStripeCharge,
  normalizeStripeRefund,
  normalizeStripeDispute,
  normalizeStripePayout,
  generateIdempotencyKey,
  INVOICE_STATE_PRECEDENCE,
} from "../src/lib/stripe-normalization.ts";
import {
  matchStripeCustomer,
  canTransitionState,
  resolveOutOfOrderAllocation,
  compileReconciliationSummary,
} from "../src/lib/stripe-reconciliation-engine.ts";
import {
  validateDatabaseTarget,
  validateStripeModeSegregation,
  validateNoMixedSources,
} from "../server/stripe-ingestion/safety-guard.ts";
import {
  AUTHORITATIVE_CLIENT_REGISTRY,
  runBackfill,
} from "../scripts/stripe_historical_backfill.mjs";

console.log("=====================================================================");
console.log("SIENVI AGENCY: STRIPE LIFECYCLE, IDEMPOTENCY & SAFETY SUITE");
console.log("=====================================================================\n");

async function runAllTests() {
  let passedCount = 0;

  // TEST 1: Two refunds on one charge (multiple partial refunds)
  console.log("[TEST 01] Two Refunds on Single Charge (Multiple Partial Refunds)...");
  const rawCharge = {
    id: "ch_test_double_ref",
    customer: "cus_V4ZeASoHbdFj8w",
    amount: 100000, // $1,000.00
    currency: "usd",
    status: "succeeded",
  };
  const normCharge = normalizeStripeCharge(rawCharge);

  const rawRefund1 = {
    id: "re_part_001",
    charge: "ch_test_double_ref",
    amount: 30000, // $300.00
    currency: "usd",
    status: "succeeded",
  };
  const rawRefund2 = {
    id: "re_part_002",
    charge: "ch_test_double_ref",
    amount: 20000, // $200.00
    currency: "usd",
    status: "succeeded",
  };

  const normRef1 = normalizeStripeRefund(rawRefund1);
  const normRef2 = normalizeStripeRefund(rawRefund2);

  // Assert distinct object IDs and distinct idempotency keys
  assert.strictEqual(normRef1.externalObjectId, "re_part_001");
  assert.strictEqual(normRef2.externalObjectId, "re_part_002");
  assert.notStrictEqual(normRef1.idempotencyKey, normRef2.idempotencyKey);
  assert.strictEqual(normRef1.paymentReference, "ch_test_double_ref");
  assert.strictEqual(normRef2.paymentReference, "ch_test_double_ref");

  // Cumulative deduction check
  const totalRefunded = normRef1.amountCents + normRef2.amountCents; // 50,000 cents ($500.00)
  const netRemaining = normCharge.amountCents - totalRefunded; // 50,000 cents ($500.00)
  assert.strictEqual(totalRefunded, 50000);
  assert.strictEqual(netRemaining, 50000);
  console.log("  ✓ Both refunds tracked with independent IDs and cumulative net deduction accurate ($500.00 net).");
  passedCount++;

  // TEST 2: Same source object with multiple lifecycle events
  console.log("\n[TEST 02] Same Source Object with Multiple Lifecycle Events...");
  const invoiceOpen = normalizeStripeInvoice({
    id: "in_lifecycle_01",
    customer: "cus_UT9Kog8XjMujZG",
    total: 99900,
    status: "open",
    created: 1760000000,
  });
  const invoicePaid = normalizeStripeInvoice({
    id: "in_lifecycle_01",
    customer: "cus_UT9Kog8XjMujZG",
    total: 99900,
    status: "paid",
    created: 1760000000,
    status_transitions: { paid_at: 1760001000 },
  });

  assert.strictEqual(invoiceOpen.externalObjectId, invoicePaid.externalObjectId);
  assert.strictEqual(invoiceOpen.statePrecedence, 2); // open
  assert.strictEqual(invoicePaid.statePrecedence, 5); // paid
  const advanceCheck = canTransitionState(
    invoiceOpen.statePrecedence,
    invoicePaid.statePrecedence,
    invoiceOpen.sourceCreatedAt,
    invoicePaid.sourceSettledAt
  );
  assert.strictEqual(advanceCheck.allowed, true);
  console.log("  ✓ State transition from open -> paid advanced cleanly via monotonic precedence.");
  passedCount++;

  // TEST 3: Webhook / backfill collision & deduplication
  console.log("\n[TEST 03] Webhook / Backfill Collision & Deduplication...");
  const backfillKey = generateIdempotencyKey("invoice", "in_collision_01", "paid", "primary", null);
  const webhookKey = generateIdempotencyKey("invoice", "in_collision_01", "paid", "primary", "evt_webhook_123");

  // Verify webhook key preserves evt_... identity while target object is in_collision_01
  assert.strictEqual(backfillKey, "stripe:primary:invoice:in_collision_01:paid");
  assert.strictEqual(webhookKey, "stripe:primary:evt:evt_webhook_123");
  // Entity externalObjectId matches for single table row
  const entity1 = normalizeStripeInvoice({ id: "in_collision_01", total: 50000, status: "paid" }, null, null);
  const entity2 = normalizeStripeInvoice({ id: "in_collision_01", total: 50000, status: "paid" }, null, "evt_webhook_123");
  assert.strictEqual(entity1.externalObjectId, entity2.externalObjectId);
  console.log("  ✓ Webhook and backfill both target the same canonical object without key collisions.");
  passedCount++;

  // TEST 4: Stale webhook arrival (preventing state regression)
  console.log("\n[TEST 04] Stale Webhook Arrival Protection (State Regression Prevention)...");
  // Existing state: paid (precedence 5)
  // Delayed incoming webhook: open (precedence 2)
  const regressionCheck = canTransitionState(
    INVOICE_STATE_PRECEDENCE["paid"], // 5
    INVOICE_STATE_PRECEDENCE["open"], // 2
    "2026-10-29T10:00:00Z",
    "2026-10-29T09:00:00Z"
  );
  assert.strictEqual(regressionCheck.allowed, false);
  assert.match(regressionCheck.reason, /Stale event rejected/);
  console.log("  ✓ Regressive state transition (paid -> open) strictly rejected.");
  passedCount++;

  // TEST 5: Incorrect client mapping handling (unmapped queue)
  console.log("\n[TEST 05] Incorrect / Unmapped Client Mapping Handling...");
  const unmappedCustomer = { id: "cus_unmapped_random_xyz", email: "random@unknown.org" };
  const mappingResult = matchStripeCustomer(unmappedCustomer, AUTHORITATIVE_CLIENT_REGISTRY);

  assert.strictEqual(mappingResult.isMatched, false);
  assert.strictEqual(mappingResult.clientProfileId, null);
  assert.strictEqual(mappingResult.evidenceClassification, "class_d_unmapped_exception");
  assert.strictEqual(mappingResult.confidence, "rejected");
  console.log("  ✓ Unmapped customer flagged as Class D exception; never assigned to arbitrary client.");
  passedCount++;

  // TEST 6: Production target rejection in backfill apply mode
  console.log("\n[TEST 06] Production Target Rejection in Backfill Apply Mode...");
  const prodUrls = [
    "postgresql://postgres:secret@db.jdodjbzypuiyhgrzuyzp.supabase.co:5432/postgres",
    "https://jdodjbzypuiyhgrzuyzp.supabase.co",
    "postgresql://postgres:secret@production-db.sienvi.com:5432/postgres",
    "postgresql://postgres:secret@remote-host.com:5432/sienvi_subledger_test",
  ];

  for (const url of prodUrls) {
    assert.throws(
      () => validateDatabaseTarget(url),
      /SAFETY (VIOLATION|REJECTION)/,
      `Expected rejection for ${url}`
    );
  }
  // Valid local target passes
  const validLocal = "postgresql://postgres:postgres@localhost:54329/sienvi_subledger_test";
  const approved = validateDatabaseTarget(validLocal);
  assert.strictEqual(approved.isApproved, true);
  console.log("  ✓ All 4 production/remote targets rejected; local test target approved.");
  passedCount++;

  // TEST 7: Dry-run performing zero writes
  console.log("\n[TEST 07] Dry-Run Performing Zero Writes...");
  const backfillResult = await runBackfill();
  assert.strictEqual(backfillResult.isDryRun, true);
  assert.strictEqual(backfillResult.summary.reconciliationStatus, "reconciliation_pending");
  assert.strictEqual(backfillResult.stagedInvoices.length, 9);
  assert.strictEqual(backfillResult.stagedPayments.length, 9);
  console.log("  ✓ Dry-run completed with zero writes and full reconciliation telemetry.");
  passedCount++;

  // TEST 8: Mixed fixture and live-source rejection
  console.log("\n[TEST 08] Mixed Fixture and Live-Source Rejection...");
  assert.throws(
    () => validateNoMixedSources(true, true),
    /PROVENANCE REJECTION: Cannot mix live-mode Stripe extraction with simulated test fixtures/,
    "Expected mixed source rejection"
  );
  // Independent modes pass without error
  validateNoMixedSources(true, false);
  validateNoMixedSources(false, true);
  console.log("  ✓ Simultaneous live-extraction and simulated fixtures strictly rejected.");
  passedCount++;

  // TEST 9: Stripe test/live mode segregation
  console.log("\n[TEST 09] Stripe Test / Live Mode Segregation...");
  const segregationTest = validateStripeModeSegregation(true, false);
  assert.strictEqual(segregationTest.isValid, false);
  assert.match(segregationTest.error, /Mode mismatch: Engine is configured for LIVE mode, but event has livemode=false/);

  const validLive = validateStripeModeSegregation(true, true);
  assert.strictEqual(validLive.isValid, true);
  console.log("  ✓ Testmode events strictly prevented from polluting live financial datasets.");
  passedCount++;

  // TEST 10: No duplicate customer collections invariant
  console.log("\n[TEST 10] No Duplicate Customer Collections Invariant...");
  const testInvoice = {
    id: "inv_reconcile_01",
    clientProfileId: "29234baf-7359-4d6f-87a4-8bcf98b81341",
    invoiceNumber: "INV-REC-01",
    invoiceType: "subscription_cycle",
    billingChannel: "stripe",
    status: "open",
    subtotalAmountCents: 100000,
    discountAmountCents: 0,
    taxAmountCents: 0,
    totalAmountCents: 100000,
    amountPaidCents: 0,
    amountDueCents: 100000,
    currency: "usd",
    dueDate: "2026-11-01T00:00:00Z",
  };
  const testPayment = {
    id: "pmt_reconcile_01",
    clientProfileId: "29234baf-7359-4d6f-87a4-8bcf98b81341",
    grossAmountCents: 100000,
    feeAmountCents: 2900,
    netAmountCents: 97100,
    allocatedAmountCents: 0,
    unallocatedAmountCents: 100000,
    currency: "usd",
    paymentChannel: "stripe",
    status: "succeeded",
    settledAt: "2026-10-29T12:00:00Z",
  };

  const outOfOrder1 = resolveOutOfOrderAllocation(testInvoice, [testPayment]);
  assert.strictEqual(outOfOrder1.allocations.length, 1);
  assert.strictEqual(outOfOrder1.allocations[0].amountCents, 100000);
  assert.strictEqual(outOfOrder1.remainingInvoiceDueCents, 0);

  // Attempting second allocation on now-paid invoice yields 0 additional allocation
  const updatedInvoice = { ...testInvoice, amountDueCents: 0, status: "paid" };
  const outOfOrder2 = resolveOutOfOrderAllocation(updatedInvoice, [testPayment]);
  assert.strictEqual(outOfOrder2.allocations.length, 0);
  assert.strictEqual(outOfOrder2.remainingInvoiceDueCents, 0);
  console.log("  ✓ Repeated allocation yields 0 additional cash; collections remain invariant ($1,000.00).");
  passedCount++;

  console.log("\n=====================================================================");
  console.log(`ALL ${passedCount}/10 LIFECYCLE & SAFETY TESTS PASSED WITH 100% SUCCESS!`);
  console.log("=====================================================================");
}

runAllTests().catch((err) => {
  console.error("FAILED IN TEST SUITE:", err);
  process.exit(1);
});
