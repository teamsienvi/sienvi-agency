/**
 * SIENVI AGENCY: READ-ONLY STRIPE EXTRACTION CLIENT (SERVER-SIDE ONLY)
 * Strictly executes GET requests against the Stripe API with pagination,
 * rate-limit backoff, and zero mutation capability.
 */

import https from "node:https";
import type { StripeExtractionConfig, StripeObjectType } from "./types.ts";

export class StripeExtractionClient {
  private apiKey: string;
  private maxRetries: number;
  private batchSize: number;
  private requestTimeoutMs: number;
  private livemode: boolean;

  constructor(config: StripeExtractionConfig) {
    if (typeof window !== "undefined") {
      throw new Error("SECURITY VIOLATION: StripeExtractionClient cannot be loaded or executed in browser environments.");
    }

    if (!config.apiKey || (!config.apiKey.startsWith("sk_live_") && !config.apiKey.startsWith("sk_test_"))) {
      throw new Error("Invalid Stripe Secret Key: Must be a valid server-side secret key starting with 'sk_live_' or 'sk_test_'.");
    }

    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries ?? 5;
    this.batchSize = Math.min(config.batchSize ?? 100, 100); // Stripe max limit is 100
    this.requestTimeoutMs = config.requestTimeoutMs ?? 30000;
    this.livemode = config.apiKey.startsWith("sk_live_");
  }

  public isLiveMode(): boolean {
    return this.livemode;
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
                  const retryAfter = parseInt(res.headers["retry-after"] || "1", 10);
                  reject({ type: "rate_limit", retryAfter });
                  return;
                }
                if (res.statusCode && res.statusCode >= 400) {
                  reject(new Error(`Stripe API error HTTP ${res.statusCode}: ${body}`));
                  return;
                }
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(new Error(`Failed to parse Stripe JSON response: ${body}`));
                }
              });
            }
          );

          req.on("timeout", () => {
            req.destroy();
            reject(new Error(`Stripe request timed out after ${this.requestTimeoutMs}ms`));
          });

          req.on("error", reject);
          req.end();
        });
      } catch (err: any) {
        if (err.type === "rate_limit" && attempt <= this.maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 500 + Math.random() * 200;
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
        if (attempt > this.maxRetries) throw err;
      }
    }
    throw new Error(`Exceeded max retries (${this.maxRetries}) fetching ${path}`);
  }

  /**
   * Paginated extraction iterator for any Stripe collection.
   */
  public async *paginate<T extends { id: string }>(
    endpoint: string,
    params: Record<string, string | number> = {},
    maxRecords: number = Infinity
  ): AsyncGenerator<T, void, unknown> {
    let startingAfter: string | undefined = undefined;
    let fetchedCount = 0;

    while (fetchedCount < maxRecords) {
      const queryParams: Record<string, string | number> = {
        limit: Math.min(this.batchSize, maxRecords - fetchedCount),
        ...params,
      };
      if (startingAfter) {
        queryParams.starting_after = startingAfter;
      }

      const response = await this.get<{ data: T[]; has_more: boolean }>(`/v1/${endpoint}`, queryParams);
      if (!response.data || response.data.length === 0) {
        break;
      }

      for (const item of response.data) {
        yield item;
        fetchedCount++;
        startingAfter = item.id;
        if (fetchedCount >= maxRecords) break;
      }

      if (!response.has_more) {
        break;
      }
    }
  }

  // High-level read-only extraction endpoints
  public getCustomers(maxRecords?: number) {
    return this.paginate<any>("customers", {}, maxRecords);
  }

  public getSubscriptions(maxRecords?: number) {
    return this.paginate<any>("subscriptions", { status: "all" }, maxRecords);
  }

  public getInvoices(maxRecords?: number) {
    return this.paginate<any>("invoices", {}, maxRecords);
  }

  public getCharges(maxRecords?: number) {
    return this.paginate<any>("charges", {}, maxRecords);
  }

  public getRefunds(maxRecords?: number) {
    return this.paginate<any>("refunds", {}, maxRecords);
  }

  public getDisputes(maxRecords?: number) {
    return this.paginate<any>("disputes", {}, maxRecords);
  }

  public getBalanceTransactions(maxRecords?: number) {
    return this.paginate<any>("balance_transactions", {}, maxRecords);
  }

  public getPayouts(maxRecords?: number) {
    return this.paginate<any>("payouts", {}, maxRecords);
  }
}
