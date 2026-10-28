import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Building2, ExternalLink, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompositionChannel, ActiveSubscriptionItem } from "@/types/executive-metrics";

interface RevenueCompositionCardProps {
  channels: CompositionChannel[];
  breakdown: ActiveSubscriptionItem[];
  operatingMrr: number;
}

export function RevenueCompositionCard({
  channels,
  breakdown,
  operatingMrr,
}: RevenueCompositionCardProps) {
  const [filter, setFilter] = useState<"all" | "stripe" | "manual">("all");

  const filteredSubs = breakdown.filter((s) => {
    if (filter === "stripe") return s.channel === "stripe_automated";
    if (filter === "manual") return s.channel === "manual_retainer";
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Revenue Composition & Channels
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Breakdown of {breakdown.length} active recurring retainers totaling {formatCurrency(operatingMrr)}/mo
            </CardDescription>
          </div>

          <Tabs value={filter} onValueChange={(val) => setFilter(val as any)} className="w-auto">
            <TabsList className="h-8 p-0.5 bg-muted/60">
              <TabsTrigger value="all" className="text-xs px-2.5 h-7">
                All ({breakdown.length})
              </TabsTrigger>
              <TabsTrigger value="stripe" className="text-xs px-2.5 h-7">
                Stripe (7)
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-xs px-2.5 h-7">
                Manual (3)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 space-y-4">
        {/* Composition Visual Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Stripe Automated: {formatCurrency(channels[0]?.amount || 0)}/mo ({channels[0]?.percentage || 0}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Manual ACH: {formatCurrency(channels[1]?.amount || 0)}/mo ({channels[1]?.percentage || 0}%)
            </span>
          </div>

          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-sky-500 transition-all duration-500"
              style={{ width: `${channels[0]?.percentage || 0}%` }}
              title={`Stripe: ${channels[0]?.percentage || 0}%`}
            />
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${channels[1]?.percentage || 0}%` }}
              title={`Manual Retainers: ${channels[1]?.percentage || 0}%`}
            />
          </div>
        </div>

        {/* Subscription Roster Table */}
        <div className="border border-border/60 rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold h-9">Client</TableHead>
                <TableHead className="text-xs font-semibold h-9">Service / Retainer</TableHead>
                <TableHead className="text-xs font-semibold h-9">Channel</TableHead>
                <TableHead className="text-xs font-semibold h-9 text-right">Billing Day</TableHead>
                <TableHead className="text-xs font-semibold h-9 text-right">Monthly Amount</TableHead>
                <TableHead className="text-xs font-semibold h-9 text-center w-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubs.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2.5 font-medium text-xs text-foreground">
                    <Link
                      to={`/admin/clients/${sub.clientId}`}
                      className="hover:underline hover:text-primary transition-colors"
                    >
                      {sub.clientName}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {sub.label}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs">
                    {sub.channel === "stripe_automated" ? (
                      <Badge variant="outline" className="text-[10px] font-normal border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/5">
                        <CreditCard className="w-2.5 h-2.5 mr-1" /> Stripe
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-normal border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                        <Building2 className="w-2.5 h-2.5 mr-1" /> ACH / Wire
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-right text-muted-foreground">
                    {sub.billingDay ? `Day ${sub.billingDay}` : "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-semibold text-right text-foreground">
                    {formatCurrency(sub.amount)}
                    <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <Link
                      to={`/admin/clients/${sub.clientId}?tab=billing`}
                      className="p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors"
                      title="Open Billing Workspace"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
