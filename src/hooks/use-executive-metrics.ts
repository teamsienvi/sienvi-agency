import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExecutiveMetricsResponse } from "@/types/executive-metrics";

export interface UseExecutiveMetricsResult {
  data: ExecutiveMetricsResponse | null;
  loading: boolean;
  refreshing: boolean;
  isUnavailable: boolean;
  isStale: boolean;
  error: string | null;
  statusCode: number | null;
  refresh: () => Promise<void>;
}

/**
 * Strict runtime response type validation for get-admin-executive-metrics.
 * Ensures the payload matches ExecutiveMetricsResponse schema before consumption.
 */
function validateExecutiveMetrics(data: unknown): data is ExecutiveMetricsResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  if (typeof d.asOf !== "string") return false;
  if (!d.revenue || typeof d.revenue !== "object") return false;

  const rev = d.revenue as Record<string, unknown>;
  const isNumber = (val: unknown): val is number => typeof val === "number" && !Number.isNaN(val);

  if (
    !isNumber(rev.operatingMrr) ||
    !isNumber(rev.stripeMrr) ||
    !isNumber(rev.manualMrr) ||
    !isNumber(rev.pastDueMrr) ||
    !isNumber(rev.pendingMrr) ||
    !isNumber(rev.openInvoicesTotal) ||
    !isNumber(rev.pastDueInvoicesTotal) ||
    !isNumber(rev.activeSubscriptionsCount) ||
    !isNumber(rev.totalSubscriptionsCount) ||
    !rev.collectedRevenue ||
    typeof (rev.collectedRevenue as Record<string, unknown>).status !== "string"
  ) {
    return false;
  }

  if (
    !d.composition ||
    typeof d.composition !== "object" ||
    !Array.isArray((d.composition as Record<string, unknown>).channels) ||
    !Array.isArray((d.composition as Record<string, unknown>).breakdown)
  ) {
    return false;
  }

  if (!d.clientHealth || typeof (d.clientHealth as Record<string, unknown>).total !== "number") {
    return false;
  }

  if (!Array.isArray(d.attentionQueue)) {
    return false;
  }

  if (!Array.isArray(d.recentActivity)) {
    return false;
  }

  return true;
}

/**
 * Authoritative executive operations metrics hook.
 *
 * Exclusively invokes the authenticated get-admin-executive-metrics Edge Function.
 * Direct database table queries and client-side financial recalculations are removed.
 *
 * Enforces:
 * - Server-side administrator role validation.
 * - Strict schema response validation.
 * - Explicit loading, unavailable, stale, and error states.
 * - No misleading $0 totals when the service is unreachable.
 */
export function useExecutiveMetrics(): UseExecutiveMetricsResult {
  const [data, setData] = useState<ExecutiveMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Authenticated session validation
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData.session) {
        throw new Error("Administrative session expired or unavailable. Please sign in again.");
      }

      const accessToken = sessionData.session.access_token;

      // 2. Invoke authoritative Edge Function
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
        "get-admin-executive-metrics",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Handle function invocation error (e.g. 401, 403, 404, 500)
      if (edgeError) {
        const errorMsg = edgeError.message || "Failed to retrieve executive metrics from server";
        // Check for common HTTP status patterns in FunctionsHttpError
        const statusMatch = errorMsg.match(/status (\d+)/i) || (edgeError as any).context?.status;
        const code = statusMatch ? Number(statusMatch) : 500;
        setStatusCode(code);

        if (code === 404) {
          setIsUnavailable(true);
          throw new Error("Executive Metrics service is not yet deployed or unreachable (HTTP 404).");
        } else if (code === 403) {
          throw new Error("Access denied. Administrator privileges required to view executive metrics.");
        } else if (code === 401) {
          throw new Error("Authentication failed. Please refresh your session.");
        } else {
          setIsUnavailable(true);
          throw new Error(`Metrics service error: ${errorMsg}`);
        }
      }

      // 3. Strict schema validation
      if (!validateExecutiveMetrics(edgeData)) {
        throw new Error("Server returned an invalid or incomplete executive metrics payload.");
      }

      // 4. Success: set authoritative metrics
      setData(edgeData);
      setIsUnavailable(false);
      setIsStale(false);
      setStatusCode(200);
    } catch (err: any) {
      console.error("[useExecutiveMetrics] Invocation error:", err);
      const message = err.message || "Executive metrics service is currently unavailable.";
      setError(message);

      // If we already had data, mark it as stale rather than destroying it
      setData((prev) => {
        if (prev) {
          setIsStale(true);
          return prev;
        }
        setIsUnavailable(true);
        return null;
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    data,
    loading,
    refreshing,
    isUnavailable,
    isStale,
    error,
    statusCode,
    refresh: () => fetchMetrics(true),
  };
}
