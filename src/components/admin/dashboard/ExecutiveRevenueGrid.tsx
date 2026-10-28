import { Link } from "react-router-dom";
import { 
  DollarSign, 
  CreditCard, 
  Building2, 
  AlertTriangle, 
  FileText, 
  HelpCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExecutiveRevenueMetrics } from "@/types/executive-metrics";

interface ExecutiveRevenueGridProps {
  metrics: ExecutiveRevenueMetrics;
}

export function ExecutiveRevenueGrid({ metrics }: ExecutiveRevenueGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Operating MRR */}
      <Card className="border border-border/80 bg-card shadow-xs hover:border-primary/40 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Operating MRR
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.operatingMrr)}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
              Active Retainers
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {metrics.activeSubscriptionsCount} active contracted retainers across agency accounts
          </p>
        </CardContent>
      </Card>

      {/* 2. Stripe Automated Recurring */}
      <Card className="border border-border/80 bg-card shadow-xs hover:border-border transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Stripe Automated
            </span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.stripeMrr)}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
            </div>
            <Badge variant="secondary" className="text-[11px] font-medium">
              {metrics.operatingMrr > 0 ? Math.round((metrics.stripeMrr / metrics.operatingMrr) * 100) : 0}% of MRR
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            7 subscriptions automated via Stripe recurring billing
          </p>
        </CardContent>
      </Card>

      {/* 3. Manual Invoiced Retainers */}
      <Card className="border border-border/80 bg-card shadow-xs hover:border-border transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Manual Retainers (ACH/Wire)
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(metrics.manualMrr)}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
            </div>
            <Badge variant="secondary" className="text-[11px] font-medium">
              {metrics.operatingMrr > 0 ? Math.round((metrics.manualMrr / metrics.operatingMrr) * 100) : 0}% of MRR
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            3 verified retainers (Pamela, Rick, Billie) invoiced manually
          </p>
        </CardContent>
      </Card>

      {/* 4. Past-Due Retainers */}
      <Card className="border border-rose-500/20 bg-card shadow-xs hover:border-rose-500/40 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Past-Due Retainers
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(metrics.pastDueMrr)}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
            </div>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px]">
              Action Required
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Susie Jung Hea Oh (Renewal Failed)</span>
            <Link
              to="/admin/clients/692bc695-094e-489d-ba16-218a3a14129a?tab=billing"
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-medium"
            >
              Resolve <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 5. Open Overdue Invoices */}
      <Card className="border border-amber-500/20 bg-card shadow-xs hover:border-amber-500/40 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Overdue Invoices
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {formatCurrency(metrics.pastDueInvoicesTotal)}
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px]">
              1 Past Due
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Timothy Montgomery (Amazon Design)</span>
            <Link
              to="/admin/clients/29234baf-2ff2-4534-b72c-7ccc276e6968?tab=billing"
              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              View <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 6. Collected Revenue (MTD) */}
      <Card className="border border-border/80 bg-card shadow-xs hover:border-border transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Collected Revenue (MTD)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Collected revenue ledger explanation">
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/70 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Historical Stripe charges are reconciled via Stripe Payouts ledger. Showing $0.00 would be misleading, so this ledger is marked as pending direct Stripe reconciliation.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-lg lg:text-xl font-semibold text-muted-foreground italic">
              Reconciliation Pending
            </div>
            <Badge variant="secondary" className="text-[11px] font-normal">
              Stripe Ledger
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Verified payouts ledger available via Stripe Dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
