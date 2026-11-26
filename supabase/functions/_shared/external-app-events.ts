// Other products share this Stripe account and tag their Stripe objects with
// metadata.app (for example The Billionaire Brother uses app: "bb"). Their
// events must not create Sienvi clients or send Sienvi emails.
export const EXTERNAL_STRIPE_APPS = new Set(["bb"]);

type Meta = { metadata?: Record<string, unknown> | null } | null | undefined;
type PriceHolder = { price?: Meta; metadata?: Record<string, unknown> | null } | null | undefined;

function appOf(holder: Meta): string | null {
  const app = holder?.metadata?.app;
  return typeof app === "string" && EXTERNAL_STRIPE_APPS.has(app) ? app : null;
}

function appOfItems(items: unknown): string | null {
  const data = (items as { data?: PriceHolder[] } | null | undefined)?.data;
  if (!Array.isArray(data)) return null;
  for (const item of data) {
    const app = appOf(item) || appOf(item?.price);
    if (app) return app;
  }
  return null;
}

/**
 * Returns the external app name when a Stripe event object (checkout session,
 * invoice or subscription) belongs to another product, otherwise null.
 */
export function getExternalStripeApp(object: unknown): string | null {
  const o = object as Record<string, any> | null | undefined;
  if (!o || typeof o !== "object") return null;
  return (
    appOf(o) ||
    // Invoices: subscription metadata is copied here (older and newer API versions)
    appOf(o.subscription_details) ||
    appOf(o.parent?.subscription_details) ||
    // Invoice lines and subscription items: metadata on the line or its price
    appOfItems(o.lines) ||
    appOfItems(o.items) ||
    null
  );
}
