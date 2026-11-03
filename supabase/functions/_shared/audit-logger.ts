import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export type AuditLogCategory = "financial" | "operational" | "security";

export type FinancialAuditAction =
  | "manual_payment_verified"
  | "invoice_created"
  | "invoice_updated"
  | "reconciliation_action"
  | "billing_exception_resolved"
  | "admin_client_created"
  | "admin_client_updated"
  | "admin_client_deleted"
  | string;

export interface AuditLogEntry {
  adminUserId: string;
  action: FinancialAuditAction;
  targetClientId?: string | null;
  category?: AuditLogCategory;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Sanitizes metadata to strictly strip sensitive fields before recording audit logs.
 * Never logs credentials, Stripe secrets, bank details, card PANs, or bearer tokens.
 */
export function sanitizeMetadata(data: Record<string, unknown> = {}): Record<string, unknown> {
  const sensitiveKeys = new Set([
    "password",
    "admin_password",
    "token",
    "access_token",
    "secret",
    "service_role_key",
    "jwt",
    "apikey",
    "authorization",
    "signature_blob",
    "raw_document",
    "stripe_secret_key",
    "stripe_webhook_secret",
    "bank_account_number",
    "routing_number",
    "iban",
    "card_number",
    "cvv",
    "pan",
    "pin",
    "bearer_token",
  ]);

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    if (
      sensitiveKeys.has(keyLower) ||
      keyLower.includes("secret") ||
      keyLower.includes("password") ||
      keyLower.includes("token")
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      sanitized[key] = sanitizeMetadata(val as Record<string, unknown>);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

/**
 * Server-side trusted audit logger.
 * Writes immutable audit event to public.admin_audit_logs table.
 * Preserves existing schema while attaching audit category metadata.
 */
export async function logAdminAudit(
  supabaseAdmin: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const cleanMeta = sanitizeMetadata(entry.metadata || {});
    // Categorize audit entry cleanly in metadata
    cleanMeta.category = entry.category || (
      entry.action.startsWith("manual_payment_") ||
      entry.action.startsWith("invoice_") ||
      entry.action.startsWith("reconciliation_") ||
      entry.action.startsWith("billing_")
        ? "financial"
        : "operational"
    );

    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([{
      admin_user_id: entry.adminUserId,
      action: entry.action,
      target_client_id: entry.targetClientId || null,
      metadata: cleanMeta,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      console.error("[AuditLog] Failed to record audit event:", error.message);
    } else {
      console.log(`[AuditLog] Recorded [${cleanMeta.category}] action '${entry.action}' by ${entry.adminUserId}`);
    }
  } catch (err) {
    console.error("[AuditLog] Unexpected error logging audit event:", err);
  }
}
