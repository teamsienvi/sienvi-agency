/**
 * SIENVI AGENCY: STRIPE INGESTION SAFETY GUARDS
 * Enforces strict environment boundaries, rejects production database targets,
 * prevents test/live mode data mixing, and guards against data leakage.
 */

const FORBIDDEN_PRODUCTION_TARGETS = [
  "jdodjbzypuiyhgrzuyzp",
  "supabase.co",
  "sienvi.com",
  "production",
  "prod-db",
];

const APPROVED_TEST_TARGETS = [
  "localhost",
  "127.0.0.1",
  "::1",
  "sienvi_subledger_test",
  "54329",
];

/**
 * Validates the database target URL before allowing --apply mode.
 * Fails closed immediately if any production or unapproved remote host is detected.
 */
export function validateDatabaseTarget(dbUrl?: string | null): {
  isApproved: boolean;
  sanitizedTarget: string;
} {
  if (!dbUrl || typeof dbUrl !== "string") {
    throw new Error(
      "SAFETY VIOLATION: Database target URL is required when executing in --apply mode. Execution halted."
    );
  }

  const urlLower = dbUrl.toLowerCase();

  // 1. Strict rejection of known production Supabase project ref or domains
  for (const forbidden of FORBIDDEN_PRODUCTION_TARGETS) {
    if (urlLower.includes(forbidden)) {
      throw new Error(
        `CRITICAL SAFETY REJECTION: Database target matches forbidden production identifier '${forbidden}'. Ingestion against production is STRICTLY PROHIBITED.`
      );
    }
  }

  // 2. Strict approval check: MUST be local isolated PostgreSQL
  const isApprovedLocalhost =
    urlLower.includes("localhost") ||
    urlLower.includes("127.0.0.1") ||
    urlLower.includes("::1");
  const isApprovedDatabaseName =
    urlLower.includes("sienvi_subledger_test") || urlLower.includes("54329");

  if (!isApprovedLocalhost || !isApprovedDatabaseName) {
    throw new Error(
      "SAFETY REJECTION: Apply mode is strictly restricted to approved local isolated test database (e.g. postgresql://...localhost:54329/sienvi_subledger_test)."
    );
  }

  // Return sanitized label hiding credentials
  let sanitizedTarget = "postgresql://***:***@localhost:54329/sienvi_subledger_test";
  try {
    const parsed = new URL(dbUrl);
    sanitizedTarget = `${parsed.protocol}//${parsed.username ? "***:***@" : ""}${parsed.hostname}:${parsed.port}${parsed.pathname}`;
  } catch {
    // Keep fallback sanitizedTarget
  }

  return { isApproved: true, sanitizedTarget };
}

/**
 * Validates that Stripe testmode and livemode records are not mixed.
 */
export function validateStripeModeSegregation(
  expectedLiveMode: boolean,
  eventLiveMode: boolean
): { isValid: boolean; error?: string } {
  if (expectedLiveMode !== eventLiveMode) {
    return {
      isValid: false,
      error: `Mode mismatch: Engine is configured for ${expectedLiveMode ? "LIVE" : "TEST"} mode, but event has livemode=${eventLiveMode}. Record rejected to prevent cross-environment pollution.`,
    };
  }
  return { isValid: true };
}

/**
 * Validates that simulated test fixtures and live Stripe records are not mixed.
 */
export function validateNoMixedSources(
  isLiveExtraction: boolean,
  hasSimulatedFixtures: boolean
): void {
  if (isLiveExtraction && hasSimulatedFixtures) {
    throw new Error(
      "PROVENANCE REJECTION: Cannot mix live-mode Stripe extraction with simulated test fixtures in a single reconciliation run."
    );
  }
}
