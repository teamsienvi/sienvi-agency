import { Link } from "react-router-dom";
import { Users, UserCheck, Clock, AlertTriangle, Handshake, Ban, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientHealthCounts } from "@/types/executive-metrics";

interface ClientHealthSummaryProps {
  health: ClientHealthCounts;
}

export function ClientHealthSummary({ health }: ClientHealthSummaryProps) {
  const healthCards = [
    {
      label: "Active Paying Clients",
      count: health.active,
      description: "Direct revenue generating accounts",
      badge: "Operating",
      badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      icon: UserCheck,
      iconColor: "text-emerald-500",
      filterUrl: "/admin/clients",
    },
    {
      label: "Partnerships & NDAs",
      count: health.partnership,
      description: "Strategic partnerships & revenue share",
      badge: "Partnership",
      badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      icon: Handshake,
      iconColor: "text-indigo-500",
      filterUrl: "/admin/clients",
    },
    {
      label: "Pending / Pipeline",
      count: health.pending,
      description: "Awaiting payment setup or proposal",
      badge: "In Progress",
      badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      icon: Clock,
      iconColor: "text-sky-500",
      filterUrl: "/admin/clients",
    },
    {
      label: "Past-Due Accounts",
      count: health.pastDue,
      description: "Failed renewal or invoice payment",
      badge: "Attention",
      badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      icon: AlertTriangle,
      iconColor: "text-rose-500",
      filterUrl: "/admin/clients",
    },
    {
      label: "Canceled Accounts",
      count: health.canceled,
      description: "Normal historical churn records",
      badge: "Archived",
      badgeClass: "bg-muted text-muted-foreground border-border",
      icon: Ban,
      iconColor: "text-muted-foreground",
      filterUrl: "/admin/clients",
    },
  ];

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Client Health & Lifecycle
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-semibold">
                {health.total} Accounts Total
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Distribution across active retainers, strategic partnerships, and lifecycle stages
            </CardDescription>
          </div>
          <Link
            to="/admin/clients"
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            Client Directory <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {healthCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={i}
                to={c.filterUrl}
                className="p-3.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted/30 hover:border-border transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${c.iconColor}`} />
                    <Badge variant="outline" className={`text-[10px] ${c.badgeClass}`}>
                      {c.badge}
                    </Badge>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {c.count}
                  </div>
                  <div className="text-xs font-medium text-foreground mt-0.5 group-hover:text-primary transition-colors">
                    {c.label}
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
                  {c.description}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
