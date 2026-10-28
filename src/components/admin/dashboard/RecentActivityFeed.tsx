import { Link } from "react-router-dom";
import { Activity, ShieldCheck, FileCheck, UserPlus, Clock, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityFeedItem } from "@/types/executive-metrics";

interface RecentActivityFeedProps {
  activities: ActivityFeedItem[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const getIcon = (type: string) => {
    if (type.includes("contract")) {
      return <FileCheck className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (type.includes("client") || type.includes("create")) {
      return <UserPlus className="w-3.5 h-3.5 text-sky-500" />;
    }
    return <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const formatTime = (iso: string) => {
    if (!iso) return "Recently";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Recent Operational Activity
            </CardTitle>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Audit Verified
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Live Event Stream
          </span>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Realtime administrative mutations, client contract executions, and state changes
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No administrative events recorded in the current session.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 7).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-border/40"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-muted/60 border border-border/50">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">{item.actor}</span>
                      <span>•</span>
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {item.clientId && (
                  <Link
                    to={`/admin/clients/${item.clientId}`}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-1"
                    title="View Client Workspace"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
