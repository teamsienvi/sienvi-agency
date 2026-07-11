import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  LogOut, 
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WebhookHealthPanel } from "@/components/admin/WebhookHealthPanel";

interface Client {
  id: string;
  email: string | null;
  clientName: string | null;
  plan: string | null;
  subscriptionStatus: string;
  isActive: boolean;
  selectedServices: string[];
  onboardingCompleted: boolean;
  customPrice: number | null;
  createdAt: string;
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  customPlans: number;
  revenue: number;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    customPlans: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

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
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("get-admin-clients", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const fetchedClients: Client[] = response.data?.clients || [];
      setClients(fetchedClients);

      const active = fetchedClients.filter(
        (c) => c.subscriptionStatus === "active" && c.isActive
      );
      const custom = fetchedClients.filter((c) => c.plan === "custom");

      // Estimate revenue (simplified)
      const planPrices: Record<string, number> = {
        single: 888,
        triple: 2398.2,
        full: 3996,
      };

      const revenue = active.reduce((sum, c) => {
        if (c.plan === "custom" && c.customPrice) return sum + c.customPrice;
        return sum + (planPrices[c.plan || ""] || 0);
      }, 0);

      setStats({
        totalClients: fetchedClients.length,
        activeClients: active.length,
        customPlans: custom.length,
        revenue,
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === "active" && isActive) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
    }
    if (status === "canceled") {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Canceled</Badge>;
    }
    if (status === "past_due") {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Past Due</Badge>;
    }
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
  };

  const getPlanBadge = (plan: string | null) => {
    const planColors: Record<string, string> = {
      single: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      triple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      full: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      custom: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    };
    const planNames: Record<string, string> = {
      single: "Single",
      triple: "Triple",
      full: "Full Suite",
      custom: "Custom",
    };
    return (
      <Badge className={planColors[plan || ""] || "bg-gray-500/20 text-gray-400"}>
        {planNames[plan || ""] || plan || "Unknown"}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-[#0f1219] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-[#0f1219]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage subscriptions and create custom bundles</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="border-[#2a3142] bg-[#1a1f2e] text-white hover:bg-[#2a3142]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="bg-gradient-to-br from-blue-500/20 to-[#1a1f2e] border-blue-500/30 cursor-pointer hover:border-blue-500/50 transition-colors"
            onClick={() => navigate("/admin/clients")}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">View All Clients</h3>
                  <p className="text-gray-400 text-sm">Manage subscriptions & services</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-400" />
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-purple-500/20 to-[#1a1f2e] border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-colors"
            onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <DollarSign className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Stripe Dashboard</h3>
                  <p className="text-gray-400 text-sm">Manage payments and invoices</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-purple-400" />
            </CardContent>
          </Card>
        </div>

        {/* Webhook Health - Discreet Collapsible */}
        <WebhookHealthPanel className="mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-gray-400 text-sm">Total Clients</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-gray-400 text-sm">Active</span>
              </div>
              <p className="text-3xl font-bold text-green-400">{stats.activeClients}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                <span className="text-gray-400 text-sm">Custom Plans</span>
              </div>
              <p className="text-3xl font-bold text-pink-400">{stats.customPlans}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-cyan-500" />
                <span className="text-gray-400 text-sm">Est. MRR</span>
              </div>
              <p className="text-3xl font-bold text-cyan-400">
                ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card className="bg-[#1a1f2e] border-[#2a3142]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              Recent Clients
            </CardTitle>
            <CardDescription className="text-gray-400">
              Canonical client records from client_profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No clients yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Clients will appear here after you create them.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a3142]">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Customer</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Plan</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Onboarding</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Services</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.slice(0, 10).map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-[#2a3142] hover:bg-[#2a3142]/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="text-white text-sm font-medium">
                            {client.clientName || client.email || "Unknown"}
                          </p>
                          {client.clientName && client.email && (
                            <p className="text-gray-500 text-xs">{client.email}</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getPlanBadge(client.plan)}
                            {client.plan === "custom" && client.customPrice && (
                              <span className="text-gray-500 text-xs">
                                ${client.customPrice.toFixed(0)}/mo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(client.subscriptionStatus, client.isActive)}
                        </td>
                        <td className="py-4 px-4">
                          {client.onboardingCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-400 text-sm">
                            {client.selectedServices?.length || 0} selected
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-500 text-sm">{formatDate(client.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#2a3142] flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Connected to Stripe</span>
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
