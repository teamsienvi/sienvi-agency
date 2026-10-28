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
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WebhookHealthPanel } from "@/components/admin/WebhookHealthPanel";
import { AdminShell } from "@/components/admin/AdminShell";

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
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Active</Badge>;
    }
    if (status === "canceled") {
      return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">Canceled</Badge>;
    }
    if (status === "past_due") {
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Past Due</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground border-border">{status}</Badge>;
  };

  const getPlanBadge = (plan: string | null) => {
    const planColors: Record<string, string> = {
      single: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      triple: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      full: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
      custom: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
    };
    const planNames: Record<string, string> = {
      single: "Single",
      triple: "Triple",
      full: "Full Suite",
      custom: "Custom",
    };
    return (
      <Badge className={planColors[plan || ""] || "bg-muted text-muted-foreground border-border"}>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      title="Operations Overview"
      description="Manage subscriptions, track webhook health, and monitor client accounts"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Overview" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="border-border text-foreground hover:bg-muted text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => navigate("/admin/create-client")}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Create Client
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Quick Action Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="bg-card border-border/80 hover:border-primary/50 transition-all cursor-pointer shadow-xs hover:shadow-sm group"
            onClick={() => navigate("/admin/clients")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Client Directory
                  </h3>
                  <p className="text-muted-foreground text-xs">Manage active retainers & services</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border/80 hover:border-purple-500/50 transition-all cursor-pointer shadow-xs hover:shadow-sm group"
            onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Stripe Dashboard
                  </h3>
                  <p className="text-muted-foreground text-xs">Manage payments & invoices</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border/80 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs hover:shadow-sm group"
            onClick={() => navigate("/admin/create-client")}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Create Client
                  </h3>
                  <p className="text-muted-foreground text-xs">Add new customer & bundle</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </CardContent>
          </Card>
        </div>

        {/* Webhook Health Panel */}
        <WebhookHealthPanel className="mb-4" />

        {/* Executive Metric Cards (Preserving exact existing calculations) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-xs font-medium">Total Clients</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stats.totalClients}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-xs font-medium">Active Accounts</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.activeClients}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-xs font-medium">Custom Plans</span>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{stats.customPlans}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-xs font-medium">Est. Monthly Retainer</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Clients Table */}
        <Card className="bg-card border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Recent Clients
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Canonical client accounts from client_profiles
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/clients")}
                className="text-xs h-7 border-border"
              >
                View All Clients
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-foreground font-medium text-sm">No clients found</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Clients will appear here after creation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Customer</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Plan</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Onboarding</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Services</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {clients.slice(0, 10).map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="text-foreground font-medium">
                            {client.clientName || client.email || "Unknown"}
                          </p>
                          {client.clientName && client.email && (
                            <p className="text-muted-foreground text-[11px] truncate max-w-[200px]">{client.email}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getPlanBadge(client.plan)}
                            {client.plan === "custom" && client.customPrice && (
                              <span className="text-muted-foreground text-[11px] font-mono">
                                ${client.customPrice.toFixed(0)}/mo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(client.subscriptionStatus, client.isActive)}
                        </td>
                        <td className="py-3 px-4">
                          {client.onboardingCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Complete</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-muted-foreground">
                            {client.selectedServices?.length || 0} selected
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">
                          {formatDate(client.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;
