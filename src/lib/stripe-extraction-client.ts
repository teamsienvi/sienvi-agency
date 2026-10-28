/**
 * SIENVI AGENCY: READ-ONLY STRIPE EXTRACTION CLIENT
 * Strictly executes GET requests against the Stripe API with pagination,
 * rate-limit backoff, and zero mutation capability.
 */

import https from "node:https";
import type { StripeExtractionConfig, StripeObjectType } from "../types/stripe-ingestion.ts";

export class StripeExtractionClient {
  private apiKey: string;
  private maxRetries: number;
  private batchSize: number;
  private requestTimeoutMs: number;

  constructor(config: StripeExtractionConfig) {
    if (!config.apiKey || !config.apiKey.startsWith("sk_")) {
      throw new Error("Invalid Stripe Secret Key: Must be a valid server-side secret key starting with 'sk_'.");
    }
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries ?? 5;
    this.batchSize = config.batchSize ?? 100; // Stripe max limit is 100
    this.requestTimeoutMs = config.requestTimeoutMs ?? 30000;
  }

  /**
   * Internal read-only GET request executor with exponential backoff for rate limits.
   */
  private async get<T>(path: string, queryParams: Record<string, string | number> = {}): Promise<T> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const fullPath = searchParams.toString() ? `${path}?${searchParams.toString()}` : path;

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        return await new Promise<T>((resolve, reject) => {
          const req = https.request(
            {
              hostname: "api.stripe.com",
              port: 443,
              path: fullPath,
              method: "GET", // STRICT INVARIANT: GET ONLY, NEVER POST/DELETE
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Stripe-Version": "2023-10-16",
                "User-Agent": "SienviSubledgerIngestion/1.0",
              },
              timeout: this.requestTimeoutMs,
            },
            (res) => {
              let body = "";
              res.on("data", (chunk) => (body += chunk));
              res.on("end", () => {
                if (res.statusCode === 429) {
                  // Rate limited
                  const err = new Error("Stripe rate limit exceeded (HTTP 429)");
                  (err as any).statusCode = 429;
                  return reject(err);
                }

                if (res.statusCode && res.statusCode >= 400) {
                  const err = new Error(`Stripe API error (${res.statusCode}): ${body}`);
                  (err as any).statusCode = res.statusCode;
                  return reject(err);
                }

                try {
                  const parsed = JSON.parse(body);
                  resolve(parsed);
                } catch (parseErr) {
                  reject(new Error(`Failed to parse Stripe response: ${body}`));
                }
              });
            }
          );

          req.on("error", reject);
          req.on("timeout", () => {
            req.destroy();
            reject(new Error(`Stripe request timed out after ${this.requestTimeoutMs}ms`));
          });
          req.end();
        });
      } catch (err: any) {
        if (err.statusCode === 429 && attempt <= this.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 500 + Math.random() * 200;
          console.warn(`[StripeRateLimit] 429 encountered on ${path}. Retrying in ${Math.round(delayMs)}ms... (Attempt ${attempt}/${this.maxRetries})`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Exceeded maximum retries (${this.maxRetries}) for path ${path}`);
  }

  /**
   * Paginates through an entire Stripe collection using cursor-based pagination (starting_after).
   */
  async *paginateCollection<T = any>(
    objectType: StripeObjectType,
    startingAfter?: string | null,
    expand: string[] = []
  ): AsyncGenerator<T[], void, unknown> {
    let hasMore = true;
    let currentCursor: string | null = startingAfter || null;

    const endpointMap: Record<StripeObjectType, string> = {
      customers: "/v1/customers",
      subscriptions: "/v1/subscriptions",
      invoices: "/v1/invoices",
      charges: "/v1/charges",
      payment_intents: "/v1/payment_intents",
      refunds: "/v1/refunds",
      disputes: "/v1/disputes",
      balance_transactions: "/v1/balance_transactions",
      payouts: "/v1/payouts",
    };

    const path = endpointMap[objectType];
    if (!path) {
      throw new Error(`Unsupported Stripe object type for pagination: ${objectType}`);
    }

    while (hasMore) {
      const queryParams: Record<string, string | number> = {
        limit: this.batchSize,
      };
      if (currentCursor) {
        queryParams.starting_after = currentCursor;
      }
      for (let i = 0; i < expand.length; i++) {
        queryParams[`expand[${i}]`] = expand[i];
      }

      const response = await this.get<{ data: T[]; has_more: boolean }>(path, queryParams);
      const items = response.data || [];

      if (items.length > 0) {
        yield items;
        currentCursor = (items[items.length - 1] as any).id;
      }

      hasMore = response.has_more && items.length > 0;
    }
  }
}
