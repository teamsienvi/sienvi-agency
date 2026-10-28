import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExecutiveRevenueGrid } from "@/components/admin/dashboard/ExecutiveRevenueGrid";
import { RevenueCompositionCard } from "@/components/admin/dashboard/RevenueCompositionCard";
import { OperationalAttentionQueue } from "@/components/admin/dashboard/OperationalAttentionQueue";
import { ClientHealthSummary } from "@/components/admin/dashboard/ClientHealthSummary";
import { RecentActivityFeed } from "@/components/admin/dashboard/RecentActivityFeed";
import { QuickOperationsPanel } from "@/components/admin/dashboard/QuickOperationsPanel";
import { useExecutiveMetrics } from "@/hooks/use-executive-metrics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, UserPlus, AlertCircle, Loader2, Clock } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
  const { data, loading, refreshing, isUnavailable, isStale, error, refresh } = useExecutiveMetrics();

  useEffect(() => {
    async function verifyAdminAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      setAuthChecking(false);
    }

    verifyAdminAuth();
  }, [navigate]);

  if (authChecking || (loading && !data)) {
    return (
      <AdminShell title="Executive Operations Command Center" description="Aggregating realtime agency financial intelligence...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <h3 className="text-sm font-semibold text-foreground">Loading Executive Metrics</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Verifying administrative credentials and reconciling recurring retainers...
          </p>
        </div>
      </AdminShell>
    );
  }

  if ((error || isUnavailable) && !data) {
    return (
      <AdminShell title="Executive Operations Command Center" description="Realtime authoritative agency operations">
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center max-w-lg mx-auto my-12 shadow-xs">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            {isUnavailable ? "Executive Metrics Service Unavailable" : "Operational Data Error"}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {error || "Authoritative metrics service could not be contacted. Client-side fallback calculation is disabled to preserve financial integrity."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button onClick={() => refresh()} variant="default" size="sm" className="text-xs gap-1.5 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Retry Request
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/admin/clients">View Client Directory</Link>
            </Button>
          </div>
        </div>
      </AdminShell>
    );
  }

  const formatUtcTime = (isoString?: string) => {
    if (!isoString) return "Realtime";
    const date = new Date(isoString);
    return date.toUTCString().replace("GMT", "UTC");
  };

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      {isStale && (
        <Badge variant="outline" className="text-[11px] font-normal gap-1 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3 h-3" />
          <span>Stale Cache (Refresh Failed)</span>
        </Badge>
      )}

      <Badge variant="outline" className="text-[11px] font-normal gap-1 bg-background/80 border-border/80 text-muted-foreground hidden sm:inline-flex">
        <Clock className="w-3 h-3 text-primary" />
        <span>As of {formatUtcTime(data?.asOf)}</span>
      </Badge>

      <Button
        variant="outline"
        size="sm"
        onClick={() => refresh()}
        disabled={refreshing}
        className="h-8 text-xs font-medium gap-1.5 bg-background border-border/80 hover:bg-muted"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>

      <Button
        asChild
        size="sm"
        className="h-8 text-xs font-medium gap-1.5 shadow-xs"
      >
        <Link to="/admin/clients/new">
          <UserPlus className="w-3.5 h-3.5" />
          <span>New Client</span>
        </Link>
      </Button>
    </div>
  );

  return (
    <AdminShell
      title="Executive Operations Command Center"
      description="Realtime agency revenue telemetry, multi-subscription retainers, and operational attention queue"
      actions={headerActions}
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Executive Command Center" }]}
    >
      <div className="space-y-6 pb-12">
        {/* 1. Executive Revenue Telemetry Grid */}
        <section aria-labelledby="revenue-telemetry-heading">
          <h2 id="revenue-telemetry-heading" className="sr-only">Revenue Telemetry</h2>
          {data && <ExecutiveRevenueGrid metrics={data.revenue} />}
        </section>

        {/* 2. Operations & Telemetry Core: 2-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Attention Queue + Revenue Composition (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Operational Attention Queue */}
            <section aria-labelledby="attention-queue-heading">
              <h2 id="attention-queue-heading" className="sr-only">Operational Attention Queue</h2>
              {data && <OperationalAttentionQueue items={data.attentionQueue} />}
            </section>

            {/* Revenue Composition Card */}
            <section aria-labelledby="revenue-composition-heading">
              <h2 id="revenue-composition-heading" className="sr-only">Revenue Composition</h2>
              {data && (
                <RevenueCompositionCard
                  channels={data.composition.channels}
                  breakdown={data.composition.breakdown}
                  operatingMrr={data.revenue.operatingMrr}
                />
              )}
            </section>
          </div>

          {/* Right Column: Operations Panel + Activity Feed (Span 1) */}
          <div className="space-y-6">
            {/* Quick Operations Panel */}
            <section aria-labelledby="quick-ops-heading">
              <h2 id="quick-ops-heading" className="sr-only">Administrative Operations</h2>
              <QuickOperationsPanel onRefresh={refresh} isRefreshing={refreshing} />
            </section>

            {/* Recent Operational Activity */}
            <section aria-labelledby="recent-activity-heading">
              <h2 id="recent-activity-heading" className="sr-only">Recent Activity</h2>
              {data && <RecentActivityFeed activities={data.recentActivity} />}
            </section>
          </div>
        </div>

        {/* 3. Client Health & Lifecycle Summary */}
        <section aria-labelledby="client-health-heading">
          <h2 id="client-health-heading" className="sr-only">Client Health and Lifecycle</h2>
          {data && <ClientHealthSummary health={data.clientHealth} />}
        </section>
      </div>
    </AdminShell>
  );
}
