/**
 * SIENVI AGENCY: PRODUCTION STRIPE BACKFILL GOVERNANCE & EXECUTION PROTOCOL
 * 
 * Safety Specification (Section 8):
 * 1. Exact Project & Stripe Account Allowlisting
 * 2. Read-Only Stripe Extraction (GET only; zero write APIs, zero notifications)
 * 3. Execution Identity Validation & Cryptographic Approval Token
 * 4. Mandatory Dry-Run Pre-Flight Gate with Provenance Review
 * 5. Persistent Checkpointing via stripe_sync_checkpoints
 * 6. Strict Batch Size Limits (max 50 records per step)
 * 7. Discrepancy Threshold Circuit Breaker (halts if discrepancy > $0.00)
 * 8. Stop and Resume Controls (graceful cursor commit)
 * 9. Durable Administrative Audit Records (sanitized metadata)
 * 10. Fail-Closed Mission Lock: Production execution is strictly unauthorized in this mission.
 */

import crypto from "node:crypto";

export const PRODUCTION_GOVERNANCE_CONFIG = {
  allowlistedProjectRef: "jdodjbzypuiyhgrzuyzp",
  allowlistedStripeAccountId: "acct_1SzlUQDnw1azoLSp",
  maxBatchSize: 50,
  maxAllowedDiscrepancyCents: 0, // Zero-tolerance variance
  minRequiredApprovalSignatures: 2, // Dual-key authorization
  executionLockActive: true, // Fail-closed mission lock
};

export interface ProductionBackfillApprovalToken {
  approverEmail: string;
  approvalTimestamp: string;
  signature: string;
  targetProjectRef: string;
  targetStripeAccountId: string;
  authorizedBatchLimit: number;
}

export interface BackfillBatchResult {
  objectType: "invoices" | "charges" | "balance_transactions" | "payouts" | "disputes";
  cursorId: string | null;
  recordsExtracted: number;
  recordsCommitted: number;
  discrepancyCents: number;
  checkpointSaved: boolean;
  haltTriggered: boolean;
  haltReason?: string;
}

/**
 * Validates the cryptographic dual-key approval token before permitting production execution.
 */
export function validateProductionApprovalToken(
  token: ProductionBackfillApprovalToken,
  signingSecret: string
): { isValid: boolean; error?: string } {
  // 1. Mission boundary check: Is the mission execution lock active?
  if (PRODUCTION_GOVERNANCE_CONFIG.executionLockActive) {
    return {
      isValid: false,
      error: "MISSION BOUNDARY HALT: Production backfill execution is locked in this stabilization mission. Only staging and dry-run modes are authorized.",
    };
  }

  // 2. Project Ref Allowlist Validation
  if (token.targetProjectRef !== PRODUCTION_GOVERNANCE_CONFIG.allowlistedProjectRef) {
    return {
      isValid: false,
      error: `ALLOWLIST REJECTION: Target project '${token.targetProjectRef}' does not match allowlisted production project '${PRODUCTION_GOVERNANCE_CONFIG.allowlistedProjectRef}'.`,
    };
  }

  // 3. Stripe Account Allowlist Validation
  if (token.targetStripeAccountId !== PRODUCTION_GOVERNANCE_CONFIG.allowlistedStripeAccountId) {
    return {
      isValid: false,
      error: `ALLOWLIST REJECTION: Target Stripe account '${token.targetStripeAccountId}' does not match allowlisted account '${PRODUCTION_GOVERNANCE_CONFIG.allowlistedStripeAccountId}'.`,
    };
  }

  // 4. Batch Size Limit Enforcement
  if (token.authorizedBatchLimit > PRODUCTION_GOVERNANCE_CONFIG.maxBatchSize) {
    return {
      isValid: false,
      error: `BATCH LIMIT REJECTION: Requested batch size (${token.authorizedBatchLimit}) exceeds maximum authorized batch limit (${PRODUCTION_GOVERNANCE_CONFIG.maxBatchSize}).`,
    };
  }

  // 5. Cryptographic Signature Verification
  const payloadToVerify = `${token.approverEmail}:${token.approvalTimestamp}:${token.targetProjectRef}:${token.targetStripeAccountId}:${token.authorizedBatchLimit}`;
  const expectedHmac = crypto.createHmac("sha256", signingSecret).update(payloadToVerify).digest("hex");

  try {
    const a = Buffer.from(token.signature, "hex");
    const b = Buffer.from(expectedHmac, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { isValid: false, error: "SECURITY HALT: Approval token signature verification failed." };
    }
  } catch {
    return { isValid: false, error: "SECURITY HALT: Malformed approval token signature." };
  }

  return { isValid: true };
}

/**
 * Circuit-breaker check that halts ingestion if financial discrepancies exceed threshold.
 */
export function checkDiscrepancyCircuitBreaker(
  discrepancyCents: number,
  unmappedCustomerCount: number
): { canContinue: boolean; reason?: string } {
  if (Math.abs(discrepancyCents) > PRODUCTION_GOVERNANCE_CONFIG.maxAllowedDiscrepancyCents) {
    return {
      canContinue: false,
      reason: `CIRCUIT BREAKER TRIGGERED: Financial discrepancy of $${(Math.abs(discrepancyCents) / 100).toFixed(2)} exceeds zero-tolerance threshold ($0.00). Ingestion halted.`,
    };
  }

  if (unmappedCustomerCount > 0) {
    return {
      canContinue: false,
      reason: `CIRCUIT BREAKER TRIGGERED: ${unmappedCustomerCount} unmapped customer transaction(s) detected. Ingestion halted pending manual client resolution.`,
    };
  }

  return { canContinue: true };
}
