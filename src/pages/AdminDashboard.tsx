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
  BarChart3,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  FileText,
  Sparkles,
  Activity,
  ChevronDown,
  MousePointer2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  icon: Icon,
}: { 
  title: string; 
  value: string | number; 
  icon: any;
}) => (
  <Card className="bg-[#1a1f2e] border-[#2a3142] hover:border-[#3a4152] transition-colors">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-cyan-400 text-sm font-medium">{title}</span>
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </CardContent>
  </Card>
);

const ProgressBar = ({ value, max, label, count }: { value: number; max: number; label: string; count: number }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{count}</span>
      </div>
      <div className="h-2 w-full bg-[#2a3142] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
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

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const days = parseInt(dateRange);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await supabase.functions.invoke('get-analytics', {
        body: { startDate, endDate }
      });

      if (response.data?.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
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
      <div className="min-h-screen bg-[#0f1219] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const maxPageViews = Math.max(...(analytics?.topPages?.map(p => p.views) || [1]));
  const maxDeviceCount = Math.max(...(analytics?.devices?.map(d => d.count) || [1]));
  const maxSourceCount = Math.max(...(analytics?.sources?.map(s => s.count) || [1]));

  return (
    <div className="min-h-screen bg-[#0f1219]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Analytics Dashboard</h1>
            <p className="text-gray-400 mt-1">Comprehensive traffic and performance analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px] bg-[#1a1f2e] border-[#2a3142] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                <SelectItem value="7" className="text-white hover:bg-[#2a3142]">Last 7 days</SelectItem>
                <SelectItem value="14" className="text-white hover:bg-[#2a3142]">Last 14 days</SelectItem>
                <SelectItem value="30" className="text-white hover:bg-[#2a3142]">Last 30 days</SelectItem>
                <SelectItem value="90" className="text-white hover:bg-[#2a3142]">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[#2a3142] bg-[#1a1f2e] text-white hover:bg-[#2a3142]"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#1a1f2e] border border-[#2a3142] p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[#2a3142] data-[state=active]:text-white text-gray-400"
            >
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="traffic" 
              className="data-[state=active]:bg-[#2a3142] data-[state=active]:text-white text-gray-400"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Traffic Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="behavior" 
              className="data-[state=active]:bg-[#2a3142] data-[state=active]:text-white text-gray-400"
            >
              <MousePointer2 className="h-4 w-4 mr-2" />
              User Behavior
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Avg Session Duration"
                value={formatDuration(analytics?.avgDuration || 0)}
                icon={Clock}
              />
              <StatCard
                title="Bounce Rate"
                value={`${analytics?.bounceRate?.toFixed(1) || 0}%`}
                icon={TrendingUp}
              />
              <StatCard
                title="Total Page Views"
                value={analytics?.pageViews || 0}
                icon={Eye}
              />
              <StatCard
                title="Pages / Session"
                value={analytics?.pagesPerVisit?.toFixed(1) || 0}
                icon={Sparkles}
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                title="Unique Visitors"
                value={analytics?.visitors || 0}
                icon={Users}
              />
              <StatCard
                title="Total Sessions"
                value={analytics?.totalSessions || 0}
                icon={BarChart3}
              />
            </div>

            {/* Top Pages */}
            <Card className="bg-[#1a1f2e] border-[#2a3142]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Top Pages
                </CardTitle>
                <p className="text-gray-400 text-sm">Most visited pages on your site</p>
              </CardHeader>
              <CardContent>
                {analytics?.topPages && analytics.topPages.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topPages.slice(0, 8).map((page, i) => (
                      <ProgressBar 
                        key={i}
                        value={page.views}
                        max={maxPageViews}
                        label={page.path === "/" ? "Homepage" : page.path}
                        count={page.views}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mb-3 opacity-50" />
                    <p>No page data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Traffic Analytics Tab */}
          <TabsContent value="traffic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Devices */}
              <Card className="bg-[#1a1f2e] border-[#2a3142]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-cyan-400" />
                    Device Distribution
                  </CardTitle>
                  <p className="text-gray-400 text-sm">Breakdown by device type</p>
                </CardHeader>
                <CardContent>
                  {analytics?.devices && analytics.devices.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.devices.map((device, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-[#2a3142] text-cyan-400">
                            {getDeviceIcon(device.device)}
                          </div>
                          <div className="flex-1">
                            <ProgressBar 
                              value={device.count}
                              max={maxDeviceCount}
                              label={device.device.charAt(0).toUpperCase() + device.device.slice(1)}
                              count={device.count}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Monitor className="h-12 w-12 mb-3 opacity-50" />
                      <p>No device data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Traffic Sources */}
              <Card className="bg-[#1a1f2e] border-[#2a3142]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-cyan-400" />
                    Traffic Sources
                  </CardTitle>
                  <p className="text-gray-400 text-sm">Where your visitors come from</p>
                </CardHeader>
                <CardContent>
                  {analytics?.sources && analytics.sources.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.sources.slice(0, 6).map((source, i) => (
                        <ProgressBar 
                          key={i}
                          value={source.count}
                          max={maxSourceCount}
                          label={source.source}
                          count={source.count}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Globe className="h-12 w-12 mb-3 opacity-50" />
                      <p>No source data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Avg Session Duration"
                value={formatDuration(analytics?.avgDuration || 0)}
                icon={Clock}
              />
              <StatCard
                title="Bounce Rate"
                value={`${analytics?.bounceRate?.toFixed(1) || 0}%`}
                icon={TrendingUp}
              />
              <StatCard
                title="Pages / Session"
                value={analytics?.pagesPerVisit?.toFixed(2) || 0}
                icon={Sparkles}
              />
            </div>

            <Card className="bg-[#1a1f2e] border-[#2a3142]">
              <CardHeader>
                <CardTitle className="text-white">Session Insights</CardTitle>
                <p className="text-gray-400 text-sm">Understanding user engagement</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-cyan-400 font-medium">Engagement Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-[#2a3142] rounded-lg">
                        <span className="text-gray-400">Total Sessions</span>
                        <span className="text-white font-bold">{analytics?.totalSessions || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#2a3142] rounded-lg">
                        <span className="text-gray-400">Unique Visitors</span>
                        <span className="text-white font-bold">{analytics?.visitors || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#2a3142] rounded-lg">
                        <span className="text-gray-400">Page Views</span>
                        <span className="text-white font-bold">{analytics?.pageViews || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-cyan-400 font-medium">Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-[#2a3142] rounded-lg">
                        <span className="text-gray-400">Avg Duration</span>
                        <span className="text-white font-bold">{formatDuration(analytics?.avgDuration || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#2a3142] rounded-lg">
                        <span className="text-gray-400">Bounce Rate</span>
                        <span className={`font-bold ${(analytics?.bounceRate || 0) > 70 ? 'text-red-400' : 'text-green-400'}`}>
                          {analytics?.bounceRate?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#2a3142] rounded-lg">
                        <span className="text-gray-400">Pages / Session</span>
                        <span className="text-white font-bold">{analytics?.pagesPerVisit?.toFixed(2) || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#2a3142] flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Live tracking active</span>
          </div>
          <div className="text-gray-500 text-sm">
            {user?.email}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
