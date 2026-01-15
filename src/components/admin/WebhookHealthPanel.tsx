import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff, AlertCircle, Clock, Mail, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    // Refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const lastWebhook = logs[0];
  const lastError = logs.find(log => log.status === "error");
  const lastSuccess = logs.find(log => log.status === "success");
  const successCount = logs.filter(log => log.status === "success").length;
  const errorCount = logs.filter(log => log.status === "error").length;

  const getHealthStatus = () => {
    if (!lastWebhook) return { status: "unknown", label: "No Data", color: "bg-gray-500" };
    
    const lastWebhookTime = new Date(lastWebhook.processed_at).getTime();
    const hourAgo = Date.now() - 60 * 60 * 1000;
    
    if (lastError && new Date(lastError.processed_at).getTime() > hourAgo) {
      return { status: "warning", label: "Recent Error", color: "bg-yellow-500" };
    }
    
    if (lastWebhookTime > hourAgo && lastSuccess) {
      return { status: "healthy", label: "Healthy", color: "bg-green-500" };
    }
    
    return { status: "stale", label: "No Recent Activity", color: "bg-gray-500" };
  };

  const health = getHealthStatus();

  if (loading) {
    return (
      <Card className={`bg-[#1a1f2e] border-[#2a3142] ${className}`}>
        <CardContent className="p-5 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-[#1a1f2e] border-[#2a3142] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            {health.status === "healthy" ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : health.status === "warning" ? (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-gray-400" />
            )}
            Webhook Health
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${health.color} text-white`}>
              {health.label}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f1219] rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Success</span>
            </div>
            <p className="text-2xl font-bold text-white">{successCount}</p>
          </div>
          <div className="bg-[#0f1219] rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Errors</span>
            </div>
            <p className="text-2xl font-bold text-white">{errorCount}</p>
          </div>
        </div>

        {/* Last webhook info */}
        <div className="space-y-3">
          {lastWebhook && (
            <div className="bg-[#0f1219] rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Last Received</span>
              </div>
              <p className="text-white text-sm font-medium">
                {formatDistanceToNow(new Date(lastWebhook.processed_at), { addSuffix: true })}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {lastWebhook.event_type}
              </p>
            </div>
          )}

          {lastSuccess?.customer_email && (
            <div className="bg-[#0f1219] rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Last Customer</span>
              </div>
              <p className="text-white text-sm font-medium truncate">
                {lastSuccess.customer_email}
              </p>
            </div>
          )}

          {lastError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Last Error</span>
              </div>
              <p className="text-red-300 text-sm font-medium truncate">
                {lastError.error_message || "Unknown error"}
              </p>
              <p className="text-red-400/60 text-xs mt-1">
                {formatDistanceToNow(new Date(lastError.processed_at), { addSuffix: true })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};