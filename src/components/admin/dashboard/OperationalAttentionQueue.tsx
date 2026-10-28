import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  AlertCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttentionQueueItem } from "@/types/executive-metrics";

interface OperationalAttentionQueueProps {
  items: AttentionQueueItem[];
}

export function OperationalAttentionQueue({ items }: OperationalAttentionQueueProps) {
  const [activeTab, setActiveTab] = useState<"all" | "billing" | "agreements" | "onboarding">("all");

  const filteredItems = items.filter((item) => {
    if (activeTab === "billing") {
      return item.type === "failed_payment" || item.type === "overdue_invoice" || item.type === "pending_installment";
    }
    if (activeTab === "agreements") {
      return item.type === "unsigned_agreement";
    }
    if (activeTab === "onboarding") {
      return item.type === "overdue_onboarding";
    }
    return true;
  });

  const getSeverityBadge = (severity: AttentionQueueItem["severity"]) => {
    switch (severity) {
      case "critical":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-semibold uppercase tracking-wider">
            Critical
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] font-semibold uppercase tracking-wider">
            Medium
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
            Notice
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: AttentionQueueItem["type"], severity: AttentionQueueItem["severity"]) => {
    switch (type) {
      case "failed_payment":
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "overdue_invoice":
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "unsigned_agreement":
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "overdue_onboarding":
        return <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    if (!iso) return "Recent";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Operational Attention Queue
              </CardTitle>
              {items.length > 0 ? (
                <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5">
                  {items.length} Actionable
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px]">
                  All Clear
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              High-priority operational issues requiring administrative action or client follow-up
            </CardDescription>
          </div>

          <div className="overflow-x-auto max-w-full pb-1 sm:pb-0">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-auto">
              <TabsList className="h-8 p-0.5 bg-muted/60 whitespace-nowrap">
                <TabsTrigger value="all" className="text-xs px-2.5 h-7">
                  All ({items.length})
                </TabsTrigger>
                <TabsTrigger value="billing" className="text-xs px-2.5 h-7">
                  Billing ({items.filter(i => i.type === "failed_payment" || i.type === "overdue_invoice" || i.type === "pending_installment").length})
                </TabsTrigger>
                <TabsTrigger value="agreements" className="text-xs px-2.5 h-7">
                  Agreements ({items.filter(i => i.type === "unsigned_agreement").length})
                </TabsTrigger>
                <TabsTrigger value="onboarding" className="text-xs px-2.5 h-7">
                  Onboarding ({items.filter(i => i.type === "overdue_onboarding").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border/60 rounded-md">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-2" />
            <h4 className="text-sm font-semibold text-foreground">Queue is Clear</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No outstanding issues match the selected category. All subscriptions and client records are synchronized.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 border border-border/60 rounded-md overflow-hidden bg-card">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-muted/50 border border-border/40">
                    {getTypeIcon(item.type, item.severity)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-foreground">
                        {item.title}
                      </span>
                      {getSeverityBadge(item.severity)}
                      <span className="text-[11px] text-muted-foreground">
                        • {item.clientName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded text-muted-foreground">
                        ID: {item.id}
                      </span>
                      <span>Recorded: {formatTimestamp(item.evidenceTimestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Link to={item.actionLink}>
                      {item.actionLabel}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
