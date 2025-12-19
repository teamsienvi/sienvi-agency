import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  LogOut, 
  ArrowLeft,
  BarChart3,
  MousePointer,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  FileText,
  RefreshCw,
  TrendingDown,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
  visitors: number;
  pageViews: number;
  avgDuration: number;
  bounceRate: number;
  pagesPerVisit: number;
  totalSessions: number;
  topPages?: { path: string; views: number }[];
  devices?: { device: string; count: number }[];
  sources?: { source: string; count: number }[];
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  delay = 0 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: any;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white/60">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/20">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs mb-1 ${
              trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-white/40"
            }`}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : 
               trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
            </div>
          )}
        </div>
        <p className="text-xs text-white/40 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const ProgressBar = ({ value, max, color = "primary" }: { value: number; max: number; color?: string }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
      <motion.div 
        className={`h-full bg-gradient-to-r from-primary to-primary/60 rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
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

      setUser(session.user);
      fetchAnalytics();
    };

    checkAuth();
  }, [navigate]);

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await supabase.functions.invoke('get-analytics', {
        body: { startDate, endDate }
      });

      if (response.data?.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-white/60">Loading analytics...</p>
        </motion.div>
      </div>
    );
  }

  const maxPageViews = Math.max(...(analytics?.topPages?.map(p => p.views) || [1]));
  const maxDeviceCount = Math.max(...(analytics?.devices?.map(d => d.count) || [1]));
  const maxSourceCount = Math.max(...(analytics?.sources?.map(s => s.count) || [1]));

  return (
    <div className="min-h-screen hero-gradient">
      <div className="container-custom py-8">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Site</span>
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-white/40 text-sm mt-0.5">Last 30 days overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchAnalytics}
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Unique Visitors"
            value={analytics?.visitors || 0}
            subtitle="Last 30 days"
            icon={Users}
            trend="up"
            delay={0}
          />
          <StatCard
            title="Page Views"
            value={analytics?.pageViews || 0}
            subtitle="Last 30 days"
            icon={Eye}
            trend="up"
            delay={0.1}
          />
          <StatCard
            title="Avg. Duration"
            value={formatDuration(analytics?.avgDuration || 0)}
            subtitle="Per session"
            icon={Clock}
            delay={0.2}
          />
          <StatCard
            title="Bounce Rate"
            value={`${analytics?.bounceRate?.toFixed(1) || 0}%`}
            subtitle="Single page visits"
            icon={TrendingUp}
            trend={analytics?.bounceRate && analytics.bounceRate < 50 ? "up" : "down"}
            delay={0.3}
          />
          <StatCard
            title="Pages / Visit"
            value={analytics?.pagesPerVisit?.toFixed(2) || 0}
            subtitle="Average pages"
            icon={MousePointer}
            delay={0.4}
          />
          <StatCard
            title="Total Sessions"
            value={analytics?.totalSessions || 0}
            subtitle="Last 30 days"
            icon={BarChart3}
            delay={0.5}
          />
        </div>

        {/* Detailed Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Pages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/10 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FileText className="h-4 w-4 text-blue-400" />
                  </div>
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topPages && analytics.topPages.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topPages.slice(0, 5).map((page, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70 truncate max-w-[180px]" title={page.path}>
                            {page.path === "/" ? "Homepage" : page.path}
                          </span>
                          <span className="text-white font-medium">{page.views}</span>
                        </div>
                        <ProgressBar value={page.views} max={maxPageViews} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-white/40">
                    <FileText className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">No page data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Devices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/10 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Monitor className="h-4 w-4 text-green-400" />
                  </div>
                  Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.devices && analytics.devices.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.devices.map((device, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-white/70">
                            {getDeviceIcon(device.device)}
                            <span className="capitalize">{device.device}</span>
                          </div>
                          <span className="text-white font-medium">{device.count}</span>
                        </div>
                        <ProgressBar value={device.count} max={maxDeviceCount} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-white/40">
                    <Monitor className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">No device data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Traffic Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/10 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Globe className="h-4 w-4 text-purple-400" />
                  </div>
                  Traffic Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.sources && analytics.sources.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.sources.slice(0, 5).map((source, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70 truncate max-w-[180px]" title={source.source}>
                            {source.source}
                          </span>
                          <span className="text-white font-medium">{source.count}</span>
                        </div>
                        <ProgressBar value={source.count} max={maxSourceCount} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-white/40">
                    <Globe className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">No source data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div 
          className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live tracking active</span>
          </div>
          <div className="text-white/40 text-sm">
            Logged in as <span className="text-white/60">{user?.email}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
