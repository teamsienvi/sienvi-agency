import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export interface AuditLogEntry {
  adminUserId: string;
  action: string;
  targetClientId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Sanitizes metadata to strictly strip sensitive fields before recording audit logs.
 */
function sanitizeMetadata(data: Record<string, unknown> = {}): Record<string, unknown> {
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
  ]);

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
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
 */
export async function logAdminAudit(
  supabaseAdmin: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([{
      admin_user_id: entry.adminUserId,
      action: entry.action,
      target_client_id: entry.targetClientId || null,
      metadata: sanitizeMetadata(entry.metadata || {}),
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      console.error("[AuditLog] Failed to record audit event:", error.message);
    }
  } catch (err) {
    console.error("[AuditLog] Unexpected error logging audit event:", err);
  }
}
