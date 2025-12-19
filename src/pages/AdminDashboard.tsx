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
  RefreshCw
} from "lucide-react";

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

      // Verify admin role
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
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </button>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchAnalytics}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Unique Visitors</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics?.visitors || 0}</div>
              <p className="text-xs text-white/50 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Page Views</CardTitle>
              <Eye className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics?.pageViews || 0}</div>
              <p className="text-xs text-white/50 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Avg. Duration</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {formatDuration(analytics?.avgDuration || 0)}
              </div>
              <p className="text-xs text-white/50 mt-1">Per session</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Bounce Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.bounceRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-white/50 mt-1">Single page visits</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Pages / Visit</CardTitle>
              <MousePointer className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.pagesPerVisit?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-white/50 mt-1">Average pages viewed</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Total Sessions</CardTitle>
              <BarChart3 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics?.totalSessions || 0}</div>
              <p className="text-xs text-white/50 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Pages */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Top Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.topPages && analytics.topPages.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topPages.map((page, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm truncate max-w-[180px]" title={page.path}>
                        {page.path}
                      </span>
                      <span className="text-white font-medium">{page.views}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-sm">No data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Devices */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.devices && analytics.devices.length > 0 ? (
                <div className="space-y-3">
                  {analytics.devices.map((device, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/80">
                        {getDeviceIcon(device.device)}
                        <span className="text-sm capitalize">{device.device}</span>
                      </div>
                      <span className="text-white font-medium">{device.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-sm">No data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Traffic Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.sources && analytics.sources.length > 0 ? (
                <div className="space-y-3">
                  {analytics.sources.map((source, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm truncate max-w-[180px]" title={source.source}>
                        {source.source}
                      </span>
                      <span className="text-white font-medium">{source.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-sm">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Info */}
        <div className="mt-8 text-white/60 text-sm">
          Logged in as: {user?.email}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
