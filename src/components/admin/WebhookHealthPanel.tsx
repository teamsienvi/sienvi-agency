import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WebhookLog {
  id: string;
  event_type: string;
  event_id: string;
  customer_email: string | null;
  status: string;
  error_message: string | null;
  processed_at: string;
}

interface WebhookHealthPanelProps {
  className?: string;
}

export const WebhookHealthPanel = ({ className }: WebhookHealthPanelProps) => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("processed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs((data as WebhookLog[]) || []);
    } catch (error) {
      console.error("Error fetching webhook logs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    fetchLogs();
  };

  const lastWebhook = logs[0];
  const lastError = logs.find(log => log.status === "error");
  const successCount = logs.filter(log => log.status === "success").length;
  const errorCount = logs.filter(log => log.status === "error").length;

  const getHealthStatus = () => {
    if (!lastWebhook) return { status: "unknown", label: "No Data", color: "bg-gray-500" };
    
    const lastWebhookTime = new Date(lastWebhook.processed_at).getTime();
    const hourAgo = Date.now() - 60 * 60 * 1000;
    
    if (lastError && new Date(lastError.processed_at).getTime() > hourAgo) {
      return { status: "warning", label: "Recent Error", color: "bg-yellow-500" };
    }
    
    if (lastWebhookTime > hourAgo) {
      return { status: "healthy", label: "Healthy", color: "bg-green-500" };
    }
    
    return { status: "stale", label: "No Recent Activity", color: "bg-gray-500" };
  };

  const health = getHealthStatus();

  if (loading) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-[#1a1f2e] border border-[#2a3142] rounded-lg cursor-pointer hover:bg-[#1f2536] transition-colors">
          <div className="flex items-center gap-3">
            {health.status === "healthy" ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : health.status === "warning" ? (
              <AlertCircle className="w-4 h-4 text-yellow-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-300">Stripe Webhooks</span>
            <Badge className={`${health.color} text-white text-xs`}>
              {health.label}
            </Badge>
            {lastWebhook && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Last: {formatDistanceToNow(new Date(lastWebhook.processed_at), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-green-400">{successCount}✓</span>
              {errorCount > 0 && <span className="text-red-400">{errorCount}✗</span>}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 bg-[#1a1f2e] border border-[#2a3142] rounded-lg space-y-3">
          {/* Recent Events */}
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Recent Events</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className={`flex items-center justify-between p-2 rounded text-xs ${
                  log.status === "error" 
                    ? "bg-red-500/10 border border-red-500/20" 
                    : "bg-[#0f1219]"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={log.status === "error" ? "text-red-400" : "text-green-400"}>
                    {log.status === "error" ? "✗" : "✓"}
                  </span>
                  <span className="text-gray-300 truncate">{log.event_type}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {log.customer_email && (
                    <span className="text-gray-500 truncate max-w-[100px]">{log.customer_email}</span>
                  )}
                  <span className="text-gray-600">
                    {formatDistanceToNow(new Date(log.processed_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {lastError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
              <div className="text-xs text-red-400 mb-1">Last Error</div>
              <p className="text-sm text-red-300 truncate">{lastError.error_message || "Unknown error"}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
