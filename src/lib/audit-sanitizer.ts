/**
 * Sienvi Agency - Administrative Audit Metadata Sanitizer
 * Redacts secrets, tokens, full PAN card numbers, CVVs, and bank account numbers
 * from audit log payloads to guarantee zero credential exposure.
 */

export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();

    // 1. Redact Stripe Secret Keys & Service Role Credentials
    if (
      lowerKey.includes("secret") ||
      lowerKey.includes("service_role") ||
      lowerKey.includes("servicerole") ||
      lowerKey.includes("api_key") ||
      lowerKey.includes("apikey")
    ) {
      if (typeof value === "string" && value.length > 0) {
        if (value.startsWith("sk_")) {
          sanitized[key] = "[REDACTED_STRIPE_KEY]";
        } else if (value.startsWith("eyJ")) {
          sanitized[key] = "[REDACTED_JWT_TOKEN]";
        } else {
          sanitized[key] = "[REDACTED_SECRET]";
        }
        continue;
      }
    }

    // 2. Redact Bearer & JWT Tokens
    if (lowerKey.includes("token") || lowerKey.includes("authorization") || lowerKey.includes("jwt")) {
      if (typeof value === "string" && value.length > 0) {
        sanitized[key] = value.toLowerCase().startsWith("bearer ")
          ? "[REDACTED_BEARER_TOKEN]"
          : "[REDACTED_JWT_TOKEN]";
        continue;
      }
    }

    // 3. Redact Full Payment Card & CVV Details
    if (
      lowerKey.includes("cardnumber") ||
      lowerKey.includes("pan") ||
      lowerKey.includes("creditcard") ||
      lowerKey.includes("cvv") ||
      lowerKey.includes("cvc")
    ) {
      sanitized[key] = lowerKey.includes("cvv") || lowerKey.includes("cvc")
        ? "[REDACTED_CVV]"
        : "[REDACTED_CARD_NUMBER]";
      continue;
    }

    // 4. Redact Bank Account Numbers & Routing Numbers
    if (
      lowerKey.includes("accountnumber") ||
      lowerKey.includes("bankaccount") ||
      lowerKey.includes("iban") ||
      lowerKey.includes("routingnumber")
    ) {
      sanitized[key] = lowerKey.includes("routing")
        ? "[REDACTED_ROUTING_NUMBER]"
        : "[REDACTED_ACCOUNT_NUMBER]";
      continue;
    }

    // Recurse into nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
