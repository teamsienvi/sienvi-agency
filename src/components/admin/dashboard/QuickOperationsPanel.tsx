import { Link } from "react-router-dom";
import { UserPlus, Users, Sparkles, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WebhookHealthPanel } from "@/components/admin/WebhookHealthPanel";

interface QuickOperationsPanelProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function QuickOperationsPanel({ onRefresh, isRefreshing }: QuickOperationsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Administrative Operations
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Key operational shortcuts and client lifecycle actions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-2.5">
          <Button
            asChild
            className="w-full justify-start h-9 text-xs font-semibold gap-2 shadow-xs"
          >
            <Link to="/admin/clients/new">
              <UserPlus className="w-4 h-4" />
              Provision New Client Profile
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full justify-start h-9 text-xs font-medium gap-2 border-border/70 hover:bg-muted/50"
          >
            <Link to="/admin/clients">
              <Users className="w-4 h-4 text-muted-foreground" />
              Open Client Directory (16)
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full justify-start h-9 text-xs font-medium gap-2 border-border/70 hover:bg-muted/50"
          >
            <Link to="/select-services">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              Public Service Catalog & Pricing
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full justify-start h-9 text-xs font-medium gap-2 border-border/70 hover:bg-muted/50"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Synchronizing Metrics..." : "Refresh Executive Metrics"}
          </Button>
        </CardContent>
      </Card>

      {/* Webhook & Synchronization Health */}
      <WebhookHealthPanel />
    </div>
  );
}
