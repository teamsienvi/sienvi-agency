import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Info,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AdminBillingOverviewResponse } from "@/types/billing-subledger";
import { toast } from "sonner";

const EMPTY_BILLING_STATE: AdminBillingOverviewResponse = {
  feature_flags: {
    billing_subledger_enabled: false,
    financial_mutations_enabled: false,
  },
  dataFreshness: {
    asOf: new Date().toISOString(),
    isLiveStripe: true,
    subledgerActive: false,
    mutationsEnabled: false,
    cacheTtlSeconds: 0,
  },
  overview: {
    operatingMrrCents: 0,
    operatingMrrFormatted: "--",
    stripeMrrCents: 0,
    stripeMrrFormatted: "--",
    manualMrrCents: 0,
    manualMrrFormatted: "--",
    pastDueMrrCents: 0,
    pendingMrrCents: 0,
    activePayingRetainersCount: 0,
    totalSubscriptionLinesCount: 0,
    grossCollectionsMtdCents: null,
    stripeFeesMtdCents: null,
    netSettledCashMtdCents: null,
    bankPayoutsMtdCents: null,
    collectedRevenueMtdCents: 0,
    collectedRevenueStatus: "reconciliation_pending",
    financialMetricsStatus: "reconciliation_pending",
    openInvoicesTotalCents: 0,
    pastDueInvoicesTotalCents: 0,
    openExceptionsCount: 0,
    sourceValidationCounts: {
      classA_directVerified: 0,
      classB_proposedEmail: 0,
      classC_manualAgreement: 0,
      classD_unmappedException: 0,
      classE_scheduledInstallment: 0,
    },
  },
  subscriptions: {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  },
  invoices: {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  },
  payments: {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  },
  exceptions: {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  },
  auditLogs: {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  },
};

export default function AdminBilling() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminBillingOverviewResponse>(EMPTY_BILLING_STATE);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters for Subscriptions view
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [subChannelFilter, setSubChannelFilter] = useState("all");

  // Filters for Invoices view
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Verify admin session & fetch live overview from Edge Function
  const loadBillingData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
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
        toast.error("Access denied. Administrator privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAuthorizedAdmin(true);
      setAuthChecking(false);

      const { data: resData, error } = await supabase.functions.invoke("get-admin-billing-overview", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("[AdminBilling] Edge function error:", error);
        setFetchError(error.message || "Failed to load live billing overview");
      } else if (resData && resData.overview) {
        setData(resData);
      } else {
        setFetchError("Received unexpected response format from billing overview service");
      }
    } catch (err: any) {
      console.error("[AdminBilling] Network error:", err);
      setFetchError(err.message || "Network error while loading billing overview");
    } finally {
      setAuthChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return data.subscriptions.items.filter((sub) => {
      const matchesSearch =
        sub.clientName.toLowerCase().includes(subSearch.toLowerCase()) ||
        sub.clientEmail.toLowerCase().includes(subSearch.toLowerCase()) ||
        sub.label.toLowerCase().includes(subSearch.toLowerCase()) ||
        (sub.stripeSubscriptionId && sub.stripeSubscriptionId.toLowerCase().includes(subSearch.toLowerCase()));
      const matchesStatus = subStatusFilter === "all" || sub.subscriptionStatus === subStatusFilter;
      const matchesChannel = subChannelFilter === "all" || sub.billingChannel === subChannelFilter;
      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [data.subscriptions.items, subSearch, subStatusFilter, subChannelFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return data.invoices.items.filter((inv) => {
      const matchesSearch =
        inv.clientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.description.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (inv.stripeInvoiceId && inv.stripeInvoiceId.toLowerCase().includes(invoiceSearch.toLowerCase()));
      const matchesStatus = invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.invoices.items, invoiceSearch, invoiceStatusFilter]);

  if (authChecking || !isAuthorizedAdmin) {
    return (
      <AdminShell
        title="Revenue & Billing Operations Center"
        description="Verifying administrative credentials..."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Revenue & Billing" },
        ]}
      >
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Verifying administrative access & loading billing telemetry...</p>
        </div>
      </AdminShell>
    );
  }

  // Verified payments & collections metrics from actual qualified data (no Operating MRR conflation)
  const isSubledgerActive = Boolean(data.dataFreshness?.subledgerActive);
  const isReconciliationPending =
    data.overview?.collectedRevenueStatus === "reconciliation_pending" ||
    data.overview?.financialMetricsStatus === "reconciliation_pending";

  // Server-Aggregated Financial Totals (computed across the FULL unpaginated dataset on the server)
  const serverGrossCollectionsCents = data.overview?.grossCollectionsMtdCents ?? null;
  const serverFeesCents = data.overview?.stripeFeesMtdCents ?? null;
  const serverNetCashCents = data.overview?.netSettledCashMtdCents ?? null;
  const serverPayoutsCents = data.overview?.bankPayoutsMtdCents ?? null;

  const isFinancialDataUnavailable = !isSubledgerActive || isReconciliationPending || serverGrossCollectionsCents === null;

  const counts = data.overview.sourceValidationCounts || {};
  const classACount = counts.classA_directVerified ?? counts.classB_stripeVerified ?? 0;
  const classCCount = counts.classC_manualAgreement ?? counts.classD_manualAgreement ?? 0;
  const classECount = counts.classE_scheduledInstallment ?? counts.classA_supabase ?? 0;
  const classBCount = counts.classB_proposedEmail ?? counts.classC_proposedEmail ?? 0;
  const classDCount = counts.classD_unmappedException ?? counts.classE_unmatched ?? 0;

  return (
    <AdminShell
      title="Revenue & Billing Operations Center"
      description="Authoritative subledger reconciliation, subscription lifecycle, and financial governance."
      breadcrumbs={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Revenue & Billing" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden sm:inline-flex bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs px-2.5 py-1 gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reconciliation Pending</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadBillingData}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {fetchError && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 flex items-center justify-between gap-3 text-xs text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to refresh live billing overview: {fetchError}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadBillingData} className="h-7 text-xs">
              Retry
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-muted/60 p-1 border border-border/80 rounded-xl grid grid-cols-2 sm:grid-cols-5 w-full h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Subscriptions ({data.subscriptions.totalItems})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Invoices & Receivables ({data.invoices.totalItems})
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Payments & Settlement
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Exceptions & Audit ({data.exceptions.totalItems})
            </TabsTrigger>
          </TabsList>

          {/* ================================================================= */}
          {/* TAB 1: OVERVIEW                                                   */}
          {/* ================================================================= */}
          <TabsContent value="overview" className="space-y-6">
            {/* Primary KPI Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Operating MRR */}
              <Card className="bg-card border-border shadow-xs border-l-4 border-l-primary">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Authoritative Operating MRR
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                    {data.overview.operatingMrrFormatted}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{data.overview.activePayingRetainersCount} Active Paying Retainers</span>
                  </p>
                </CardContent>
              </Card>

              {/* Stripe Automated vs Manual Offline */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Channel Composition
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Stripe Automated:
                    </span>
                    <span className="font-mono font-bold text-foreground">{data.overview.stripeMrrFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Manual Offline:
                    </span>
                    <span className="font-mono font-bold text-foreground">{data.overview.manualMrrFormatted}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Past-Due Commitments */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Past-Due Commitments
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    ${(data.overview.pastDueMrrCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Isolated from Operating MRR • Pending: ${(data.overview.pendingMrrCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Collections & Reconciliation Status */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Collected Revenue Status
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs py-1 px-2.5 gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reconciliation Pending</span>
                  </Badge>
                  <p className="text-[11px] text-muted-foreground">
                    Subledger ingestion disabled (`FEATURE_BILLING_SUBLEDGER_ENABLED=false`). Historical cash backfill pending Gate D/E.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Source Validation & Provenance Breakdown */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Authoritative Provenance & Evidence Classification</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Subledger classification across all {data.overview.totalSubscriptionLinesCount} subscription lines and payment channels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class A: Direct Stripe</span>
                    <span className="text-lg font-bold font-mono text-primary block mt-1">
                      {classACount}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Live-mode Stripe ID matched</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class C: Offline Retainers</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
                      {classCCount}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Signed contract (ACH/wire)</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class E: Installments</span>
                    <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 block mt-1">
                      {classECount}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Staged scheduled installment</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class B: Proposed Email</span>
                    <span className="text-lg font-bold font-mono text-muted-foreground block mt-1">
                      {classBCount}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Requires manual confirmation</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class D: Exceptions</span>
                    <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 block mt-1">
                      {classDCount}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Unmapped queue items</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Read-Only Financial Guard Notice */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 flex items-start gap-3 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Read-Only Safety Enforcement Active: </span>
                All financial write actions (mark verified, cancel subscription, issue invoice, refund charge) are locked
                server-side (`FEATURE_FINANCIAL_MUTATIONS_ENABLED=false`). Direct browser ledger mutation is disabled.
              </div>
            </div>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 2: SUBSCRIPTIONS                                              */}
          {/* ================================================================= */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Subscription Line Items ({filteredSubscriptions.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Searchable registry of active, past-due, and pending recurring client billing lines
                    </CardDescription>
                  </div>

                  {/* Disabled Action Button with Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1.5 opacity-60 cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Add Subscription (Locked)</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Financial mutations disabled in read-only mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 pt-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by client, email, service, or Stripe ID..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                  <select
                    value={subStatusFilter}
                    onChange={(e) => setSubStatusFilter(e.target.value)}
                    aria-label="Filter subscriptions by status"
                    className="h-8 text-xs rounded-md border border-border bg-background px-2.5 text-foreground"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="past_due">Past Due</option>
                  </select>
                  <select
                    value={subChannelFilter}
                    onChange={(e) => setSubChannelFilter(e.target.value)}
                    aria-label="Filter subscriptions by billing channel"
                    className="h-8 text-xs rounded-md border border-border bg-background px-2.5 text-foreground"
                  >
                    <option value="all">All Channels</option>
                    <option value="stripe_automated">Stripe Automated</option>
                    <option value="manual_retainer">Manual Retainer</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Package / Service</TableHead>
                        <TableHead className="font-semibold">Monthly Amount</TableHead>
                        <TableHead className="font-semibold">Channel</TableHead>
                        <TableHead className="font-semibold">Cycle Day</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Stripe Object ID</TableHead>
                        <TableHead className="text-right font-semibold">Workspace & Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                            No subscription records match the current search or filter criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions.map((sub) => (
                          <TableRow key={sub.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <Link
                                to={`/admin/clients/${sub.clientId}?tab=billing`}
                                className="font-semibold text-foreground hover:text-primary transition-colors block"
                              >
                                {sub.clientName}
                              </Link>
                              <span className="text-[11px] text-muted-foreground">{sub.clientEmail}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-foreground font-medium">{sub.label}</span>
                              <span className="text-[10px] text-muted-foreground block uppercase font-mono">{sub.plan}</span>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-foreground">
                              ${(sub.monthlyAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                            </TableCell>
                            <TableCell>
                              {sub.billingChannel === "stripe_automated" ? (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">
                                  Stripe Auto
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                                  Manual Retainer
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {sub.billingDay ? `Day ${sub.billingDay}` : "Auto"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  sub.subscriptionStatus === "active"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : sub.subscriptionStatus === "past_due"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                }
                              >
                                {sub.subscriptionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {sub.stripeSubscriptionId ? (
                                <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                  <span className="truncate max-w-[130px]">{sub.stripeSubscriptionId}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(sub.stripeSubscriptionId!, sub.id)}
                                    className="h-6 w-6 p-0"
                                    title="Copy Stripe Subscription ID"
                                  >
                                    {copiedId === sub.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">None (Offline)</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-7 text-xs px-2.5"
                                >
                                  <Link to={`/admin/clients/${sub.clientId}?tab=billing`}>
                                    <span>Workspace</span>
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </Link>
                                </Button>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="sm" disabled className="h-7 text-xs opacity-50 cursor-not-allowed px-2">
                                        <Lock className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Subscription mutations locked (Read-Only Mode)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 3: INVOICES & RECEIVABLES                                     */}
          {/* ================================================================= */}
          <TabsContent value="invoices" className="space-y-4">
            {/* Reconciliation Pending Banner for Historical Invoices */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Reconciliation Pending — Recurring Stripe Invoice Backfill Locked: </span>
                  <span className="text-muted-foreground">
                    Displaying verified one-time and recorded subledger invoices from production. Historical recurring Stripe subscription invoices will populate after Gate D/E backfill activation.
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] shrink-0">
                Reconciliation Pending
              </Badge>
            </div>

            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Authoritative Invoice Ledger ({filteredInvoices.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Verified production invoice records, open balances, and settlement statuses
                    </CardDescription>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1.5 opacity-60 cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Issue Invoice (Locked)</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Invoice creation disabled in read-only mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search invoice number, client, Stripe ID, or description..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                  <select
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    aria-label="Filter invoices by status"
                    className="h-8 text-xs rounded-md border border-border bg-background px-2.5 text-foreground"
                  >
                    <option value="all">All Invoices</option>
                    <option value="open">Open</option>
                    <option value="paid">Paid</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Invoice #</TableHead>
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Total Amount</TableHead>
                        <TableHead className="font-semibold">Amount Paid</TableHead>
                        <TableHead className="font-semibold">Balance Due</TableHead>
                        <TableHead className="font-semibold">Due Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-10 text-center text-xs text-muted-foreground">
                            No invoice records match the current filter criteria. Historical recurring Stripe invoices are pending subledger reconciliation.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono font-bold text-foreground">
                              <div>{inv.invoiceNumber}</div>
                              {inv.stripeInvoiceId && (
                                <span className="text-[10px] text-muted-foreground font-normal block">
                                  {inv.stripeInvoiceId}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              <Link
                                to={`/admin/clients/${inv.clientId}?tab=billing`}
                                className="hover:text-primary transition-colors font-semibold"
                              >
                                {inv.clientName}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[240px] truncate">
                              {inv.description}
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-foreground">
                              ${(inv.totalAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-mono text-emerald-600 dark:text-emerald-400">
                              ${(inv.amountPaidCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-foreground">
                              ${(inv.amountDueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  inv.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : inv.status === "past_due"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                }
                              >
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {inv.hostedInvoiceUrl && (
                                  <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                                    <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                      <span>Invoice</span>
                                      <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                  </Button>
                                )}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="sm" disabled className="h-7 text-xs opacity-50 cursor-not-allowed">
                                        <Lock className="w-3 h-3 mr-1" />
                                        <span>Void</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Voiding disabled (Read-Only Mode)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 4: PAYMENTS & RECONCILIATION                                 */}
          {/* ================================================================= */}
          <TabsContent value="payments" className="space-y-6">
            {/* Cash & Payout Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Gross Collections MTD
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  {isFinancialDataUnavailable || serverGrossCollectionsCents === null ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold font-mono text-muted-foreground">--</div>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] py-0.5 px-2 gap-1">
                          <Clock className="w-3 h-3" />
                          Reconciliation Pending
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Requires active subledger cash verification</span>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold font-mono text-foreground">
                        ${(serverGrossCollectionsCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Server-Aggregated Cash Total
                      </span>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stripe Processing Fees
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  {isFinancialDataUnavailable || serverFeesCents === null ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold font-mono text-muted-foreground">--</div>
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] py-0.5 px-2 gap-1">
                          Data Unavailable
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Documented payment processor records</span>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold font-mono text-muted-foreground">
                        ${(serverFeesCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-muted-foreground">Documented gateway fees</span>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Net Settled Operating Cash
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  {isFinancialDataUnavailable || serverNetCashCents === null ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold font-mono text-muted-foreground">--</div>
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] py-0.5 px-2 gap-1">
                          Data Unavailable
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Gross collections minus processor fees</span>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        ${(serverNetCashCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-muted-foreground">Gross minus processing fees</span>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Bank Payouts (Non-Revenue)
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  {isFinancialDataUnavailable || serverPayoutsCents === null ? (
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold font-mono text-muted-foreground">--</div>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] py-0.5 px-2 gap-1">
                        Data Unavailable
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                      ${(serverPayoutsCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  <span className="text-[11px] text-muted-foreground">Operating account transfers from Stripe payouts</span>
                </CardContent>
              </Card>
            </div>

            {/* Payments Table */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground">
                  Cash Settlement & Payment Transactions ({data.payments.totalItems})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Stripe charges, cleared bank wires, and reconciled cash receipts in `billing_payments`
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Channel</TableHead>
                        <TableHead className="font-semibold">Gross Amount</TableHead>
                        <TableHead className="font-semibold">Fee</TableHead>
                        <TableHead className="font-semibold">Net Cash</TableHead>
                        <TableHead className="font-semibold">Reference #</TableHead>
                        <TableHead className="font-semibold">Settled Timestamp</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.payments.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-12 text-center">
                            <div className="max-w-lg mx-auto space-y-2.5">
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs py-1 px-2.5 gap-1.5 mx-auto">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Reconciliation Pending</span>
                              </Badge>
                              <p className="text-sm font-semibold text-foreground">
                                Subledger Settlement Ingestion Disabled (`FEATURE_BILLING_SUBLEDGER_ENABLED=false`)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Historical Stripe charges, processor fee deductions, and cleared bank transfers exist in upstream Stripe and bank statements but have not yet been backfilled into `billing_payments`. Client-submitted transfer notices awaiting verification are listed under the Exceptions & Audit tab.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.payments.items.map((pmt) => (
                          <TableRow key={pmt.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">{pmt.clientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                {pmt.paymentChannel}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-foreground">
                              ${(pmt.grossAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              ${(pmt.feeAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              ${(pmt.netAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground text-[11px]">
                              {pmt.bankReferenceNumber}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-[11px]">
                              {new Date(pmt.settledAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  pmt.status === "succeeded"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]"
                                }
                              >
                                {pmt.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" disabled className="h-7 text-xs opacity-50 cursor-not-allowed">
                                      <Lock className="w-3 h-3 mr-1" />
                                      <span>Refund</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Refunds disabled (Read-Only Mode)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 5: EXCEPTIONS & AUDIT                                         */}
          {/* ================================================================= */}
          <TabsContent value="exceptions" className="space-y-6">
            {/* Exceptions Queue */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Operational Exception & Discrepancy Queue ({data.exceptions.totalItems})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {data.exceptions.totalItems} Open Items
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Unverified bank transfer notices, past-due retainers, and scheduled installments awaiting settlement
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {data.exceptions.items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No open billing exceptions or discrepancies in the queue.
                  </div>
                ) : (
                  data.exceptions.items.map((exc) => (
                    <div key={exc.id} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              exc.severity === "critical" || exc.severity === "high"
                                ? "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]"
                            }
                          >
                            {exc.severity.toUpperCase()}
                          </Badge>
                          <span className="font-bold text-xs text-foreground">{exc.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {exc.clientId && (
                            <Button variant="outline" size="sm" asChild className="h-6 text-[11px] px-2">
                              <Link to={`/admin/clients/${exc.clientId}?tab=billing`}>
                                <span>{exc.clientName}</span>
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Link>
                            </Button>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {exc.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{exc.description}</p>
                      {exc.suggestedAction && (
                        <div className="p-2.5 rounded-md bg-background border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Recommended action: {exc.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Financial Audit Trail */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Durable Financial Audit Events ({data.auditLogs.totalItems})</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Immutable audit records from `admin_audit_logs` with sanitized credentials and actor attribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Timestamp</TableHead>
                        <TableHead className="font-semibold">Action</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold">Target Client</TableHead>
                        <TableHead className="font-semibold">Metadata Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.auditLogs.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                            No administrative financial mutation events have been recorded in `admin_audit_logs` yet (Read-Only Canary Mode Active).
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.auditLogs.items.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-muted-foreground text-[11px]">
                              {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-foreground">{log.action}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                {log.category || "financial"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground text-[11px]">
                              {log.target_client_id ? log.target_client_id.slice(0, 8) + "..." : "System"}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[280px] truncate">
                              {JSON.stringify(log.metadata || {})}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
