import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users,
  LayoutDashboard,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Send,
  CreditCard,
  FileSignature,
  Download,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Link as LinkIcon,
  Loader2,
  DollarSign,
  Calendar,
  Building2,
  ArrowLeft,
  FileText,
  Layers,
  Sparkles,
  Receipt,
  Globe,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { DeleteClientDialog } from "@/components/admin/DeleteClientDialog";
import { OnboardingResponsesModal } from "@/components/admin/OnboardingResponsesModal";
import { copyToClipboard as safeCopyToClipboard } from "@/lib/utils";
import {
  Client,
  isPartnershipClient,
  isCommissionClient,
  getMonthlyPrice,
  getPlanDisplay,
  getOnboardingTypeDisplay,
  getRequiredOnboardingForms,
} from "@/types/client";

export default function AdminClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [onboardingResponsesModalOpen, setOnboardingResponsesModalOpen] = useState(false);

  // Action loading states
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatingOnboardingLink, setGeneratingOnboardingLink] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailingCheckoutLink, setEmailingCheckoutLink] = useState(false);
  const [migratingToStripe, setMigratingToStripe] = useState(false);
  const [previewingBilling, setPreviewingBilling] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    if (!id) return;
    setLoading(true);
    try {
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
        .single();

      if (!roleData) {
        toast.error("Admin access required");
        navigate("/");
        return;
      }

      const response = await supabase.functions.invoke("get-admin-clients", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const clients: Client[] = response.data.clients || [];
      const found = clients.find((c) => c.id === id);

      if (!found) {
        setClient(null);
      } else {
        setClient(found);
      }
    } catch (err: any) {
      console.error("Error fetching client:", err);
      toast.error(err.message || "Failed to load client record");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClient();
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    const success = await safeCopyToClipboard(text);
    if (success) {
      setCopiedField(fieldId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.info("Select and copy manually");
    }
  };

  // Action handlers
  const handleGenerateCheckoutLink = async () => {
    if (!client || generatingLink) return;
    setGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-checkout-link", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          plan: client.plan,
          customPrice: client.customPrice,
          selectedServices: client.selectedServices,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      const checkoutUrl = response.data.checkoutUrl;
      await copyToClipboard(checkoutUrl, "checkout-link");
      toast.success("Direct checkout link copied to clipboard!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate checkout link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleEmailCheckoutLink = async () => {
    if (!client || emailingCheckoutLink) return;
    setEmailingCheckoutLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const linkRes = await supabase.functions.invoke("generate-checkout-link", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          plan: client.plan,
          customPrice: client.customPrice,
          selectedServices: client.selectedServices,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (linkRes.error) throw new Error(linkRes.error.message);
      const checkoutUrl = linkRes.data.checkoutUrl;

      const emailRes = await supabase.functions.invoke("send-checkout-email", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          clientName: client.clientName,
          checkoutUrl,
          plan: client.plan,
          price: client.customPrice,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (emailRes.error) throw new Error(emailRes.error.message);
      toast.success(`Checkout invoice emailed to ${client.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to email checkout link");
    } finally {
      setEmailingCheckoutLink(false);
    }
  };

  const handleMigrateToStripe = async () => {
    if (!client || migratingToStripe) return;
    setMigratingToStripe(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-checkout-link", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          plan: client.plan,
          customPrice: client.customPrice,
          selectedServices: client.selectedServices,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);
      const checkoutUrl = response.data.checkoutUrl;
      await copyToClipboard(checkoutUrl, "migration-link");
      toast.success("Stripe migration setup link copied to clipboard!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate migration link");
    } finally {
      setMigratingToStripe(false);
    }
  };

  const handleGenerateOnboardingLink = async () => {
    if (!client || generatingOnboardingLink) return;
    setGeneratingOnboardingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("send-login-invite", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          clientName: client.clientName,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);
      const url = response.data?.loginUrl;
      if (url) {
        setOnboardingLink(url);
        await copyToClipboard(url, "onboarding-link");
        toast.success("1-Click Onboarding Link copied to clipboard!");
      } else {
        toast.success("Invite processed successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate onboarding link");
    } finally {
      setGeneratingOnboardingLink(false);
    }
  };

  const handleSendLoginInvite = async () => {
    if (!client || sendingEmail) return;
    setSendingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("send-login-invite", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          clientName: client.clientName,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);
      toast.success(`Login invite successfully emailed to ${client.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send email invite");
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePreviewBilling = async () => {
    if (!client || previewingBilling) return;
    setPreviewingBilling(true);
    try {
      const response = await supabase.functions.invoke("create-customer-portal-session", {
        body: { email: client.email },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);
      window.open(response.data.url, "_blank");
      toast.success("Opened Stripe billing portal in new tab");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPreviewingBilling(false);
    }
  };

  const openStripeCustomer = (customerId: string) => {
    window.open(`https://dashboard.stripe.com/customers/${customerId}`, "_blank");
  };

  if (loading) {
    return (
      <AdminShell
        title="Client Workspace"
        description="Loading account data..."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Clients", href: "/admin/clients" }, { label: "Loading..." }]}
      >
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading workspace data...</p>
        </div>
      </AdminShell>
    );
  }

  if (!client) {
    return (
      <AdminShell
        title="Client Not Found"
        description="The requested client account could not be found."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Clients", href: "/admin/clients" }, { label: "Not Found" }]}
      >
        <div className="text-center py-16 space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto opacity-60" />
          <h2 className="text-lg font-bold text-foreground">Client Record Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The client identifier ({id}) does not exist in the database or may have been deleted.
          </p>
          <Button onClick={() => navigate("/admin/clients")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Client Directory
          </Button>
        </div>
      </AdminShell>
    );
  }

  // Financial & Commercial Calculations
  const hasSubs = (client.subscriptions?.length ?? 0) > 0;
  const isPartnership = isPartnershipClient(client);
  const isCommission = isCommissionClient(client);

  const combinedRetainer = isPartnership
    ? 0
    : isCommission
    ? 0
    : hasSubs
    ? client.subscriptions!.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0)
    : getMonthlyPrice(client.plan, client.customPrice, client.selectedServices);

  const allActive = hasSubs && client.subscriptions!.every((s) => s.subscriptionStatus === "active");
  const anyActive = hasSubs && client.subscriptions!.some((s) => s.subscriptionStatus === "active");
  const allSigned = hasSubs && client.subscriptions!.every((s) => s.contractStatus === "signed");
  const anySigned = hasSubs && client.subscriptions!.some((s) => s.contractStatus === "signed");

  const totalServicesCount = hasSubs
    ? client.subscriptions!.reduce((sum, s) => sum + (s.selectedServices?.length || 0), 0)
    : client.selectedServices?.length || client.maxServices || 1;

  // Next billing date detection
  const firstSubWithBillingDay = client.subscriptions?.find((s) => s.billingDay);
  const nextBillingText = firstSubWithBillingDay
    ? `Day ${firstSubWithBillingDay.billingDay} of month`
    : client.stripeSubscriptionId
    ? "Monthly Auto-Debit"
    : "Manual / Pending";

  // Payment channel classification
  const paymentChannelText = isPartnership
    ? "Strategic Partnership ($0/mo)"
    : isCommission
    ? "Performance Commission"
    : client.stripeCustomerId && !client.stripeCustomerId.startsWith("pending_")
    ? "Stripe Auto-Debit"
    : "Bank Wire / Domestic ACH";

  return (
    <AdminShell
      title={client.clientName || client.email || "Client Workspace"}
      description={`${client.email || "No email"} • Workspace ID: ${client.id}`}
      breadcrumbs={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Clients", href: "/admin/clients" },
        { label: client.clientName || client.email || "Workspace" },
      ]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 text-xs border-border text-foreground hover:bg-muted"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/dashboard?clientId=${client.id}`, "_blank")}
            className="h-8 text-xs border-border text-foreground hover:bg-muted gap-1.5"
            title="Preview authenticated client view"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
            <span>Preview Dashboard</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditClientModalOpen(true)}
            className="h-8 text-xs border-border text-foreground hover:bg-muted gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Edit Profile</span>
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs border-border text-foreground hover:bg-muted px-2.5">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Client Access
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={handleGenerateOnboardingLink} className="gap-2 cursor-pointer">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Generate 1-Click Link</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendLoginInvite} className="gap-2 cursor-pointer">
                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                <span>Send Login Invite</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Billing & Stripe
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={handleGenerateCheckoutLink} className="gap-2 cursor-pointer">
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                <span>Copy Checkout Link</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEmailCheckoutLink} className="gap-2 cursor-pointer">
                <Send className="w-3.5 h-3.5 text-purple-500" />
                <span>Email Checkout Link</span>
              </DropdownMenuItem>
              {client.stripeCustomerId && !client.stripeCustomerId.startsWith("pending_") ? (
                <>
                  <DropdownMenuItem onClick={() => openStripeCustomer(client.stripeCustomerId)} className="gap-2 cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>View in Stripe</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePreviewBilling} className="gap-2 cursor-pointer">
                    <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Preview Billing Portal</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={handleMigrateToStripe} className="gap-2 cursor-pointer">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>Migrate to Stripe</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Agreements
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => window.open(`/contract?clientId=${client.id}`, "_blank")}
                className="gap-2 cursor-pointer"
              >
                <FileSignature className="w-3.5 h-3.5 text-blue-500" />
                <span>Open Signing Page</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`/contract?view=true&clientId=${client.id}`, "_blank")}
                className="gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                <span>View Web Contract</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteClientModalOpen(true)}
                className="gap-2 text-destructive focus:text-destructive cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/admin/clients"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Client Directory</span>
          </Link>
        </div>

        {/* Top Badges & Identification Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
              {(client.clientName || client.email || "C")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {client.clientName || "Unnamed Account"}
                </h2>
                <Badge variant="outline" className="text-xs font-medium border-border">
                  {getPlanDisplay(client.plan, client.customPrice, client.selectedServices, client)}
                </Badge>
                {isPartnership ? (
                  <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">
                    Partner (NDA)
                  </Badge>
                ) : isCommission ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Commission-Based
                  </Badge>
                ) : hasSubs && allActive ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Active Subscriptions
                  </Badge>
                ) : (
                  <Badge
                    className={
                      client.subscriptionStatus === "active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : client.subscriptionStatus === "past_due"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    }
                  >
                    {client.subscriptionStatus === "pending_payment" ? "Awaiting Payment" : client.subscriptionStatus}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{client.email || "No email address"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Registered: {new Date(client.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Summary KPIs Bar (6 Verified Metric Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Monthly Retainer */}
          <Card className="bg-card border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">Monthly Retainer</span>
              <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {isPartnership ? (
                  <span className="text-purple-600 dark:text-purple-400">$0.00</span>
                ) : isCommission ? (
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">Commission</span>
                ) : (
                  `$${combinedRetainer.toLocaleString()}`
                )}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Billing Channel */}
          <Card className="bg-card border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">Payment Channel</span>
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate" title={paymentChannelText}>
                {paymentChannelText}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Active Services */}
          <Card className="bg-card border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">Active Services</span>
              <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {totalServicesCount} <span className="text-xs font-normal text-muted-foreground">in scope</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Agreement Status */}
          <Card className="bg-card border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">Agreement</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                {hasSubs ? (
                  allSigned ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Signed
                    </span>
                  ) : anySigned ? (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Partial Signed
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Not Signed
                    </span>
                  )
                ) : client.contractStatus === "signed" ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {isPartnership ? "NDA Signed" : "Signed"}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {isPartnership ? "NDA Pending" : "Pending Sign"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Onboarding Progress */}
          <Card className="bg-card border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">Onboarding</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                {client.onboardingCompleted ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete (100%)
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending Form
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Next Billing Date */}
          <Card className="bg-card border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">Billing Cycle</span>
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate" title={nextBillingText}>
                {nextBillingText}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Workspace Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full space-y-4">
          <TabsList className="bg-muted/60 p-1 border border-border/80 rounded-xl grid grid-cols-3 sm:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Services ({totalServicesCount})
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Billing & Subs
            </TabsTrigger>
            <TabsTrigger value="agreements" className="text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Agreements
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Activity & Notes
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Contact & Entity Information */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Account & Legal Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Client Legal Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {client.contractDetails?.clientLegalName || client.clientName || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Trade Name / DBA</span>
                      <span className="font-semibold text-foreground text-sm">
                        {client.contractDetails?.clientTradeName || client.clientName || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Primary Contact Person</span>
                      <span className="font-medium text-foreground">
                        {client.contractDetails?.clientContactName || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Primary Contact Email</span>
                      <span className="font-medium text-foreground truncate block">
                        {client.contractDetails?.clientEmail || client.email || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Jurisdiction</span>
                      <span className="font-medium text-foreground">
                        {client.contractDetails?.clientJurisdiction || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Registered Address</span>
                      <span className="font-medium text-foreground truncate block">
                        {client.contractDetails?.clientAddress || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Created Date</span>
                      <span className="font-medium text-foreground">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Stripe Customer Reference</span>
                      <span className="font-mono text-xs font-medium text-foreground truncate block">
                        {client.stripeCustomerId || "None"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones & Next Actions */}
              <div className="space-y-4">
                {/* Actionable Next Step Card */}
                <Card className="bg-card border-border shadow-xs border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Recommended Next Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    {client.contractStatus !== "signed" && !isPartnership ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Client agreement is pending signature. Share the direct signing link or inspect the contract.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => window.open(`/contract?clientId=${client.id}`, "_blank")}
                          className="h-8 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <FileSignature className="w-3.5 h-3.5 mr-1.5" />
                          Open Client Signing Page
                        </Button>
                      </div>
                    ) : client.subscriptionStatus === "pending_payment" ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Contract signed. Client is awaiting initial invoice payment.
                        </p>
                        <Button
                          size="sm"
                          onClick={handleGenerateCheckoutLink}
                          disabled={generatingLink}
                          className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          Generate Checkout URL
                        </Button>
                      </div>
                    ) : !client.onboardingCompleted ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Payment is active. Client onboarding questionnaire is pending completion.
                        </p>
                        <Button
                          size="sm"
                          onClick={handleGenerateOnboardingLink}
                          disabled={generatingOnboardingLink}
                          className="h-8 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                          Copy 1-Click Onboarding Link
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Account active and onboarding complete!
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/dashboard?clientId=${client.id}`, "_blank")}
                          className="h-8 text-xs"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          Preview Client Dashboard
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Milestones Checklist */}
                <Card className="bg-card border-border shadow-xs">
                  <CardHeader className="pb-2 border-b border-border/60">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Account Progress Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-foreground">1. Account Provisioned</span>
                      </div>
                      <span className="text-muted-foreground text-[11px]">{new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {client.contractStatus === "signed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="font-medium text-foreground">2. Client Agreement Signed</span>
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {client.contractSignedAt ? new Date(client.contractSignedAt).toLocaleDateString() : "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {client.subscriptionStatus === "active" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="font-medium text-foreground">3. Payment & Subscription Active</span>
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {client.subscriptionStatus === "active" ? "Active" : "Awaiting Payment"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {client.onboardingCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="font-medium text-foreground">4. Onboarding Questionnaire Complete</span>
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {client.onboardingCompleted ? "Complete" : "Pending"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SERVICES */}
          <TabsContent value="services" className="space-y-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Selected Services & Deliverables</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {totalServicesCount} Services Assigned
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Active agency automation tools, marketing channels, and consulting deliverables
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {hasSubs ? (
                  <div className="space-y-4">
                    {client.subscriptions!.map((sub, sIdx) => (
                      <div key={sub.id || sIdx} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{sub.label}</span>
                            {sub.isPrimary && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                Primary Line
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono font-bold text-xs text-foreground">
                            ${sub.monthlyAmount.toLocaleString()}/mo
                          </span>
                        </div>

                        {sub.notes && <p className="text-xs text-muted-foreground italic">{sub.notes}</p>}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {sub.selectedServices && sub.selectedServices.length > 0 ? (
                            sub.selectedServices.map((svc, i) => (
                              <Badge key={i} variant="secondary" className="text-xs py-1 px-2.5">
                                {svc}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No individual services listed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : client.selectedServices && client.selectedServices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {client.selectedServices.map((svc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors flex items-center gap-2.5"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground">{svc}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4">No services currently selected.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: BILLING & SUBSCRIPTIONS */}
          <TabsContent value="billing" className="space-y-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>Independent Subscription Lines</span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    Combined: ${combinedRetainer.toLocaleString()}/mo
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Preserved multi-subscription billing schedules, Stripe IDs, and payment channels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {hasSubs ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Line Item</th>
                          <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Monthly Amount</th>
                          <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Billing Day</th>
                          <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Status</th>
                          <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Stripe Sub ID</th>
                          <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Agreement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 font-mono">
                        {client.subscriptions!.map((sub, sIdx) => (
                          <tr key={sub.id || sIdx} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2.5 px-3 font-sans font-medium text-foreground">
                              {sub.label}
                              {sub.isPrimary && (
                                <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 text-[10px]">Primary</Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-foreground">${sub.monthlyAmount.toLocaleString()}/mo</td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {sub.billingDay ? `Day ${sub.billingDay}` : "Auto"}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant={sub.subscriptionStatus === "active" ? "default" : "outline"} className="text-[10px]">
                                {sub.subscriptionStatus}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-muted-foreground truncate max-w-[150px]">
                              {sub.stripeSubscriptionId || "None (Manual)"}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              {sub.contractStatus === "signed" ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Signed</span>
                              ) : (
                                <span className="text-muted-foreground">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">Single Recurring Subscription Plan</p>
                      <p className="text-muted-foreground mt-0.5">Plan: {client.plan || "Standard"}</p>
                    </div>
                    <span className="font-bold text-sm text-foreground">${combinedRetainer.toLocaleString()}/mo</span>
                  </div>
                )}

                {/* Stripe Customer & Subscription Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
                  <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Stripe Customer ID
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground block truncate max-w-[200px]">
                        {client.stripeCustomerId || "None"}
                      </span>
                    </div>
                    {client.stripeCustomerId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(client.stripeCustomerId, "stripe-cus-id")}
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === "stripe-cus-id" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Stripe Subscription ID
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground block truncate max-w-[200px]">
                        {client.stripeSubscriptionId || "None (Manual / Wire)"}
                      </span>
                    </div>
                    {client.stripeSubscriptionId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(client.stripeSubscriptionId!, "stripe-sub-id")}
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === "stripe-sub-id" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: AGREEMENTS */}
          <TabsContent value="agreements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card A: Signature Status & Document Actions */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-primary" />
                    Agreement Status & Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Status</span>
                    {client.contractStatus === "signed" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Signed & Enforceable
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">
                        Awaiting Client Signature
                      </Badge>
                    )}
                  </div>

                  {client.contractSignature && (
                    <div className="pb-3 border-b border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1">Digitally Signed By</span>
                      <span className="font-serif italic font-bold text-base text-indigo-700 dark:text-indigo-300">
                        {client.contractSignature}
                      </span>
                      {client.contractSignedAt && (
                        <span className="text-muted-foreground text-[11px] block mt-0.5">
                          Timestamp: {new Date(client.contractSignedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                      Document Actions
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {client.contractDetails?.uploadedProposalUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(client.contractDetails.uploadedProposalUrl, "_blank")}
                          className="h-8 text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          View Proposal PDF
                        </Button>
                      )}

                      {client.contractDetails?.uploadedContractUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(client.contractDetails.uploadedContractUrl, "_blank")}
                          className="h-8 text-xs"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download Original PDF
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/contract?view=true&clientId=${client.id}`, "_blank")}
                        className="h-8 text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        View Signed Web Contract
                      </Button>

                      {client.contractStatus !== "signed" && (
                        <Button
                          size="sm"
                          onClick={() => window.open(`/contract?clientId=${client.id}`, "_blank")}
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <FileSignature className="w-3.5 h-3.5 mr-1.5" />
                          Open Client Sign Page
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card B: Compensation Terms */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Compensation & Fee Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Monthly Admin Fee:</span>
                    <span className="font-semibold text-foreground">
                      {client.contractDetails?.monthlyFee || `$${combinedRetainer.toLocaleString()}/mo`}
                    </span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Setup Fee:</span>
                    <span className="font-semibold text-foreground">{client.contractDetails?.setupFee || "$0.00"}</span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Commission Terms:</span>
                    <span className="font-semibold text-foreground">
                      {client.contractDetails?.commissionTerms || (isCommission ? "Performance Commission" : "None")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Terms:</span>
                    <span className="font-medium text-foreground">{client.contractDetails?.billingTerms || "Monthly in Advance"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Direct Signing Link Box */}
            <Card className="bg-card border-border shadow-xs">
              <CardContent className="p-4 space-y-2">
                <span className="text-xs font-semibold text-foreground block">Direct Client Contract Signing URL</span>
                <p className="text-[11px] text-muted-foreground">
                  Send this exact link to the client or legal contact to execute the agreement digitally:
                </p>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 text-xs bg-muted/50 p-2 rounded border border-border text-foreground font-mono break-all">
                    {`${window.location.origin}/contract?clientId=${client.id}`}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/contract?clientId=${client.id}`, "signing-url")}
                    className="h-8 px-3 text-xs"
                  >
                    {copiedField === "signing-url" ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    <span>{copiedField === "signing-url" ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: ONBOARDING */}
          <TabsContent value="onboarding" className="space-y-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <span>Onboarding Status & Questionnaires</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOnboardingResponsesModalOpen(true)}
                    className="h-8 text-xs font-medium border-border"
                  >
                    <ClipboardList className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    {client.onboardingCompleted ? "View Full Responses" : "Preview Forms"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Assigned Questionnaire Model</span>
                    <span className="font-semibold text-foreground text-sm">{getOnboardingTypeDisplay(client)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Completion Status</span>
                    <div className="mt-1">
                      {client.onboardingCompleted ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          Complete (Responses on File)
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                          Pending Client Submission
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider mb-2">
                    Required Forms in Pipeline
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {getRequiredOnboardingForms(client).map((formName, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs py-1 px-2.5">
                        {formName}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 1-Click Client Access Card */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground text-xs block">1-Click Client Access & Magic Setup Link</span>
                      <p className="text-[11px] text-muted-foreground">
                        Single setup URL for client: Sign In ➔ Contract ➔ Payment ➔ Onboarding Forms
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleGenerateOnboardingLink}
                      disabled={generatingOnboardingLink}
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {generatingOnboardingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <LinkIcon className="w-3.5 h-3.5 mr-1" />}
                      Generate / Copy Link
                    </Button>
                  </div>

                  {onboardingLink && (
                    <div className="flex gap-2 items-center pt-2">
                      <code className="flex-1 text-xs bg-background p-2 rounded border border-border text-foreground font-mono break-all">
                        {onboardingLink}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(onboardingLink, "active-1click")}
                        className="h-8 text-xs"
                      >
                        {copiedField === "active-1click" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: ACTIVITY & NOTES */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Internal Administrative Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-3">
                {client.notes ? (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border font-sans leading-relaxed text-foreground whitespace-pre-wrap">
                    {client.notes}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No administrative notes recorded for this account.</p>
                )}

                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditClientModalOpen(true)}
                    className="h-7 text-xs border-border"
                  >
                    <Pencil className="w-3 h-3 mr-1.5" />
                    Edit Notes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Verified Event History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="font-medium text-foreground">Client Profile Created</span>
                  <span className="text-muted-foreground font-mono">{new Date(client.createdAt).toLocaleString()}</span>
                </div>
                {client.contractSignedAt && (
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-medium text-foreground">Digital Agreement Executed</span>
                    <span className="text-muted-foreground font-mono">{new Date(client.contractSignedAt).toLocaleString()}</span>
                  </div>
                )}
                {client.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Last Database Record Update</span>
                    <span className="text-muted-foreground font-mono">{new Date(client.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fallback Modals */}
      <EditClientModal
        open={editClientModalOpen}
        onOpenChange={setEditClientModalOpen}
        client={client as any}
        onClientUpdated={fetchClient}
      />

      <DeleteClientDialog
        open={deleteClientModalOpen}
        onOpenChange={setDeleteClientModalOpen}
        client={client}
        onClientDeleted={() => {
          toast.success("Client account removed");
          navigate("/admin/clients");
        }}
      />

      <OnboardingResponsesModal
        open={onboardingResponsesModalOpen}
        onOpenChange={setOnboardingResponsesModalOpen}
        clientId={client.id}
        clientName={client.clientName || client.email || "Client"}
      />
    </AdminShell>
  );
}
