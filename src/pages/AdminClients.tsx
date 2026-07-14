import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Users,
  Search,
  Copy,
  ExternalLink,
  Eye,
  Check,
  RefreshCw,
  UserPlus,
  Pencil,
  Trash2,
  Link,
  Loader2,
  Mail,
  ClipboardList,
  CreditCard,
  Send,
  Download,
  FileSignature,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { DeleteClientDialog } from "@/components/admin/DeleteClientDialog";
import { OnboardingResponsesModal } from "@/components/admin/OnboardingResponsesModal";

interface Client {
  id: string;
  email: string | null;
  clientName: string | null;
  plan: string | null;
  subscriptionStatus: string;
  isActive: boolean;
  selectedServices: string[];
  onboardingCompleted: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  customPrice: number | null;
  maxServices: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contractStatus?: string | null;
  contractDetails?: any;
  contractSignature?: string | null;
  contractSignedAt?: string | null;
}

const planPrices: Record<string, number> = {
  single: 888,
  triple: 2398.20,
  full: 3996,
  amazon: 999,
};

// Service-specific prices for when plan is "single" but service is amazon-design
const servicePrices: Record<string, number> = {
  "amazon-design": 999,
  "social-media-suite": 2450,
  "custom-lms": 2450,
  "custom-website": 888,
  "seo-aeo": 888,
  "custom-ai-assistant": 888,
};

const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailingCheckoutLink, setEmailingCheckoutLink] = useState<string | null>(null);
  const [migratingToStripe, setMigratingToStripe] = useState<string | null>(null);
  const [onboardingViewClient, setOnboardingViewClient] = useState<Client | null>(null);

  useEffect(() => {
    checkAdminAndFetchClients();
  }, []);

  const checkAdminAndFetchClients = async () => {
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

      await fetchClients();
    } catch (error) {
      console.error("Error:", error);
      navigate("/admin");
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("get-admin-clients", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setClients(response.data.clients || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (client: Client) => {
    if (client.subscriptionStatus === "pending_payment") {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Awaiting Payment</Badge>;
    }
    if (!client.isActive || client.subscriptionStatus === "canceled") {
      return <Badge variant="destructive">Canceled</Badge>;
    }
    if (client.subscriptionStatus === "past_due") {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Past Due</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  const getPlanDisplay = (plan: string | null, customPrice: number | null, selectedServices: string[] = []) => {
    if (plan === "custom" && customPrice) {
      return `Custom ($${customPrice}/mo)`;
    }
    
    // Check if it's Amazon Design (either by plan or selected service)
    if (plan === "amazon" || selectedServices.includes("amazon-design")) {
      return "Amazon Design Package";
    }
    
    // Check if it's Advertising
    if (plan === "advertising" || selectedServices.includes("advertising-package")) {
      const channelCount = selectedServices.filter(s => s.startsWith("channel-")).length;
      return channelCount ? `Advertising (${channelCount} ch)` : "Advertising Package";
    }
    
    const planLabels: Record<string, string> = {
      single: "Single Service",
      triple: "Triple Automation",
      full: "Full Automation",
    };
    return planLabels[plan || ""] || plan || "Unknown";
  };

  const getMonthlyPrice = (plan: string | null, customPrice: number | null, selectedServices: string[] = []) => {
    if (plan === "custom" && customPrice) return customPrice;
    
    // Amazon Design Package
    if (plan === "amazon" || selectedServices.includes("amazon-design")) {
      return 999;
    }
    
    // Advertising Package - calculate based on channel count
    if (plan === "advertising" || selectedServices.includes("advertising-package")) {
      const channelCount = selectedServices.filter(s => s.startsWith("channel-")).length;
      if (channelCount === 0) return 999;
      if (channelCount === 1) return 999;
      if (channelCount === 2) return 1998;
      if (channelCount >= 3) {
        // Bundle pricing: $493/channel, capped at $3,450 for all 7
        const bundlePrice = channelCount * 493;
        return Math.min(bundlePrice, 3450);
      }
      return 888;
    }
    
    // For single plan, check the actual service
    if (plan === "single" && selectedServices.length > 0) {
      const service = selectedServices[0];
      return servicePrices[service] || planPrices[plan] || 0;
    }
    
    return planPrices[plan || ""] || 0;
  };

  const getOnboardingType = (client: Client) => {
    const services = client.selectedServices || [];
    const plan = client.plan;
    
    if (services.includes("custom-tool") || plan === "custom-lms" || plan === "discovery") {
      return "discovery";
    }
    if (services.includes("amazon-design") || plan === "amazon") {
      return "amazon";
    }
    
    const hasAdvertising = plan === "advertising" || services.includes("advertising-package") || services.some((s: string) => s.startsWith("advertising")) || services.some((s: string) => s.startsWith("channel-"));
    const hasGeneral = services.some((s: string) => !s.startsWith("channel-") && s !== "advertising-package" && s !== "amazon-design" && s !== "custom-tool");
    
    if (hasGeneral && hasAdvertising) {
      return "standard";
    }
    if (hasAdvertising) {
      return "advertising";
    }
    return "standard";
  };

  const getOnboardingTypeDisplay = (client: Client) => {
    const type = getOnboardingType(client);
    switch (type) {
      case "discovery":
        return "Business Admin Onboarding";
      case "amazon":
        return "Amazon Listing Design Onboarding";
      case "advertising":
        return "Advertising Campaign Onboarding";
      case "standard":
        return "Standard Client Onboarding";
      default:
        return "Standard Client Onboarding";
    }
  };

  const getRequiredOnboardingForms = (client: Client) => {
    const type = getOnboardingType(client);
    if (type === "discovery") {
      return ["Business Admin Onboarding Questionnaire"];
    }
    if (type === "amazon") {
      return ["Amazon Listing Design Questionnaire"];
    }
    
    const baseForms = ["SMART Goal Sheet", "Customer Avatar Profiles"];
    const services = client.selectedServices || [];
    const hasGeneral = services.some((s: string) => !s.startsWith("channel-") && s !== "advertising-package" && s !== "amazon-design" && s !== "custom-tool");
    const hasAdvertising = type === "advertising" || services.includes("advertising-package") || services.some((s: string) => s.startsWith("advertising")) || services.some((s: string) => s.startsWith("channel-"));
    
    if (hasGeneral && hasAdvertising) {
      return [...baseForms, "General Onboarding Questionnaire", "Advertising Campaign Questionnaire"];
    } else if (hasAdvertising) {
      return [...baseForms, "Advertising Campaign Questionnaire"];
    } else {
      return [...baseForms, "General Onboarding Questionnaire"];
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openStripeCustomer = (customerId: string) => {
    window.open(`https://dashboard.stripe.com/customers/${customerId}`, "_blank");
  };

  const handleGenerateCheckoutLink = async (client: Client) => {
    if (generatingLink) return;
    
    setGeneratingLink(client.id);
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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      const checkoutUrl = response.data.checkoutUrl;
      await navigator.clipboard.writeText(checkoutUrl);
      toast.success("Checkout link copied to clipboard!");
    } catch (error: any) {
      console.error("Error generating checkout link:", error);
      toast.error(error.message || "Failed to generate checkout link");
    } finally {
      setGeneratingLink(null);
    }
  };

  const handleEmailCheckoutLink = async (client: Client) => {
    if (emailingCheckoutLink) return;
    
    setEmailingCheckoutLink(client.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // First generate the checkout link
      const linkResponse = await supabase.functions.invoke("generate-checkout-link", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          plan: client.plan,
          customPrice: client.customPrice,
          selectedServices: client.selectedServices,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (linkResponse.error) throw new Error(linkResponse.error.message);
      if (linkResponse.data.error) throw new Error(linkResponse.data.error);

      const checkoutUrl = linkResponse.data.checkoutUrl;

      // Then send the email with the checkout link
      const emailResponse = await supabase.functions.invoke("send-checkout-email", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          clientName: client.clientName,
          checkoutUrl: checkoutUrl,
          plan: client.plan,
          price: client.customPrice,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (emailResponse.error) throw new Error(emailResponse.error.message);
      if (emailResponse.data.error) throw new Error(emailResponse.data.error);

      toast.success("Checkout link emailed to " + client.email);
    } catch (error: any) {
      console.error("Error emailing checkout link:", error);
      toast.error(error.message || "Failed to email checkout link");
    } finally {
      setEmailingCheckoutLink(null);
    }
  };

  const handleMigrateToStripe = async (client: Client) => {
    if (migratingToStripe) return;
    
    setMigratingToStripe(client.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Generate a checkout link for migration (creates Stripe customer/subscription)
      const response = await supabase.functions.invoke("generate-checkout-link", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          plan: client.plan,
          customPrice: client.customPrice,
          selectedServices: client.selectedServices,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      const checkoutUrl = response.data.checkoutUrl;
      await navigator.clipboard.writeText(checkoutUrl);
      toast.success("Migration checkout link copied! Send to client to complete Stripe setup.");
    } catch (error: any) {
      console.error("Error generating migration link:", error);
      toast.error(error.message || "Failed to generate migration link");
    } finally {
      setMigratingToStripe(null);
    }
  };

  const handleSendLoginInvite = async (client: Client) => {
    if (sendingEmail) return;
    
    setSendingEmail(client.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("send-login-invite", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          clientName: client.clientName,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      toast.success("Login invite sent to " + client.email);
    } catch (error: any) {
      console.error("Error sending login invite:", error);
      toast.error(error.message || "Failed to send login invite");
    } finally {
      setSendingEmail(null);
    }
  };

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesPlan = planFilter === "all" || client.plan === planFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending_payment" && client.subscriptionStatus === "pending_payment") ||
        (statusFilter === "active" && client.isActive && client.subscriptionStatus === "active") ||
        (statusFilter === "past_due" && client.subscriptionStatus === "past_due") ||
        (statusFilter === "canceled" && (!client.isActive || client.subscriptionStatus === "canceled"));
      return matchesSearch && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "highest_value") {
        return getMonthlyPrice(b.plan, b.customPrice, b.selectedServices) - getMonthlyPrice(a.plan, a.customPrice, a.selectedServices);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Client Overview</h1>
                <p className="text-muted-foreground">
                  Manage all client subscriptions (Stripe-only billing)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Templates
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem asChild>
                    <a
                      href="/onboarding_forms_pdf/1_SMART_Goals_Sheet.pdf"
                      download="1_SMART_Goals_Sheet.pdf"
                      className="cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>1. SMART Goals Sheet</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/onboarding_forms_pdf/2_Customer_Avatar_Profile.pdf"
                      download="2_Customer_Avatar_Profile.pdf"
                      className="cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>2. Customer Avatar Profile</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/onboarding_forms_pdf/3_General_Onboarding_Questionnaire.pdf"
                      download="3_General_Onboarding_Questionnaire.pdf"
                      className="cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>3. General Onboarding</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/onboarding_forms_pdf/4_Amazon_Listing_Design_Questionnaire.pdf"
                      download="4_Amazon_Listing_Design_Questionnaire.pdf"
                      className="cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>4. Amazon Listing Design</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/onboarding_forms_pdf/5_Advertising_Campaign_Questionnaire.pdf"
                      download="5_Advertising_Campaign_Questionnaire.pdf"
                      className="cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>5. Advertising Campaign</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/onboarding_forms_pdf/6_Business_Admin_Onboarding_Questionnaire.pdf"
                      download="6_Business_Admin_Onboarding_Questionnaire.pdf"
                      className="cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>6. Business Onboarding</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/onboarding_forms_pdf/7_General_Discovery_Questionnaire.pdf"
                      download="7_General_Discovery_Questionnaire.pdf"
                      className="cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>7. General Discovery</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => navigate("/admin/create-client")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
              <Button onClick={fetchClients} variant="outline" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
        >
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Awaiting Payment</p>
            <p className="text-2xl font-bold text-orange-600">
              {clients.filter((c) => c.subscriptionStatus === "pending_payment").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {clients.filter((c) => c.isActive && c.subscriptionStatus === "active").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Custom Plans</p>
            <p className="text-2xl font-bold text-primary">
              {clients.filter((c) => c.plan === "custom").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Est. MRR</p>
            <p className="text-2xl font-bold">
              ${clients
                .filter((c) => c.isActive && c.subscriptionStatus === "active")
                .reduce((sum, c) => sum + getMonthlyPrice(c.plan, c.customPrice, c.selectedServices), 0)
                .toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-xl border shadow-sm mb-6"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="single">Single Service</SelectItem>
                <SelectItem value="triple">Triple Bundle</SelectItem>
                <SelectItem value="full">Full Suite</SelectItem>
                <SelectItem value="amazon">Amazon Design</SelectItem>
                <SelectItem value="advertising">Advertising</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Awaiting Payment</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest_value">Highest Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Clients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No clients found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {client.clientName || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.email || "No email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {getPlanDisplay(client.plan, client.customPrice, client.selectedServices)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${getMonthlyPrice(client.plan, client.customPrice, client.selectedServices).toLocaleString()}/mo
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(client)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {client.selectedServices.length > 0 ? (
                          client.selectedServices.slice(0, 2).map((service, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                        {client.selectedServices.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{client.selectedServices.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(client.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClient(client)}
                          title="View Details"
                          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditClient(client)}
                          title="Edit Client"
                          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteClient(client)}
                          title="Delete Client"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {client.subscriptionStatus === "pending_payment" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateCheckoutLink(client)}
                              title="Copy Checkout Link"
                              className="text-blue-600 hover:text-blue-700"
                              disabled={generatingLink === client.id}
                            >
                              {generatingLink === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Link className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEmailCheckoutLink(client)}
                              title="Email Checkout Link"
                              className="text-cyan-600 hover:text-cyan-700"
                              disabled={emailingCheckoutLink === client.id}
                            >
                              {emailingCheckoutLink === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {/* Migrate to Stripe for active clients without proper Stripe subscription */}
                        {client.subscriptionStatus === "active" && 
                         (!client.stripeSubscriptionId || client.stripeCustomerId?.startsWith("pending_")) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMigrateToStripe(client)}
                            title="Migrate to Stripe"
                            className="text-orange-600 hover:text-orange-700"
                            disabled={migratingToStripe === client.id}
                          >
                            {migratingToStripe === client.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendLoginInvite(client)}
                          title="Send Login Invite"
                          className="text-green-600 hover:text-green-700"
                          disabled={sendingEmail === client.id}
                        >
                          {sendingEmail === client.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOnboardingViewClient(client)}
                          title={client.onboardingCompleted ? "View Onboarding Responses" : "Preview / View Onboarding"}
                          className={client.onboardingCompleted ? "text-purple-600 hover:text-purple-700" : "text-slate-400 hover:text-slate-600"}
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Button>
                        {client.contractStatus === "signed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/contract?view=true&clientId=${client.id}`, "_blank")}
                            title="View Signed Contract"
                            className="text-indigo-600 hover:text-indigo-700"
                          >
                            <FileSignature className="w-4 h-4" />
                          </Button>
                        )}
                        {client.stripeCustomerId && !client.stripeCustomerId.startsWith("pending_") && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(client.stripeCustomerId, client.id)}
                              title="Copy Customer ID"
                              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                              {copiedId === client.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStripeCustomer(client.stripeCustomerId)}
                              title="View in Stripe"
                              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>

        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-slate-900">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client Name</p>
                    <p className="font-medium">{selectedClient.clientName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedClient.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">
                      {getPlanDisplay(selectedClient.plan, selectedClient.customPrice, selectedClient.selectedServices)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Price</p>
                    <p className="font-medium">
                      ${getMonthlyPrice(selectedClient.plan, selectedClient.customPrice, selectedClient.selectedServices).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedClient)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Onboarding</p>
                    <div className="mt-1">
                      {selectedClient.onboardingCompleted ? (
                        <Badge className="bg-green-100 text-green-700">Complete</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contract</p>
                    <div className="mt-1">
                      {selectedClient.contractStatus === "signed" ? (
                        <Badge className="bg-green-100 text-green-700">Signed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not Signed</Badge>
                      )}
                    </div>
                  </div>
                  {selectedClient.maxServices && (
                    <div>
                      <p className="text-sm text-muted-foreground">Max Services</p>
                      <p className="font-medium">{selectedClient.maxServices}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Subscribed</p>
                    <p className="font-medium">
                      {new Date(selectedClient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Selected Services</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.selectedServices.length > 0 ? (
                      selectedClient.selectedServices.map((service, i) => (
                        <Badge key={i} variant="secondary">
                          {service}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No services selected yet</p>
                    )}
                  </div>
                </div>

                {selectedClient.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Internal Notes</p>
                    <p className="bg-muted p-3 rounded-lg text-sm">{selectedClient.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4 text-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Contract Details</h4>
                    <div className="flex gap-2">
                      {selectedClient.contractStatus === "signed" ? (
                        selectedClient.contractDetails?.uploadedContractUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(selectedClient.contractDetails.uploadedContractUrl, "_blank")}
                            className="h-8 text-xs"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Download Contract
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/contract?view=true&clientId=${selectedClient.id}`, "_blank")}
                            className="h-8 text-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View Signed Contract
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/contract?view=true&clientId=${selectedClient.id}`, "_blank")}
                          className="h-8 text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Preview Draft Contract
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Contract Template Type</p>
                      <p className="font-medium text-slate-800">
                        {selectedClient.contractDetails?.uploadedContractUrl
                          ? `Custom Upload: ${selectedClient.contractDetails.uploadedContractName || "Uploaded PDF"}`
                          : (selectedClient.plan === "amazon" || 
                             selectedClient.selectedServices.includes("channel-amazon") || 
                             selectedClient.selectedServices.includes("amazon-design"))
                          ? "Business Agreement for Amazon Advertising Services"
                          : "Client Service Agreement"}
                      </p>
                    </div>

                    {selectedClient.contractStatus === "signed" && !selectedClient.contractDetails?.uploadedContractUrl && (
                      <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Effective Date</p>
                          <p className="font-medium">{selectedClient.contractDetails?.effectiveDate || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Client Legal Name</p>
                          <p className="font-medium">{selectedClient.contractDetails?.clientLegalName || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Trade Name (DBA)</p>
                          <p className="font-medium">{selectedClient.contractDetails?.clientTradeName || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Jurisdiction</p>
                          <p className="font-medium">{selectedClient.contractDetails?.clientJurisdiction || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Client Address</p>
                          <p className="font-medium">{selectedClient.contractDetails?.clientAddress || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Name</p>
                          <p className="font-medium">{selectedClient.contractDetails?.clientContactName || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Email</p>
                          <p className="font-medium">{selectedClient.contractDetails?.clientEmail || "-"}</p>
                        </div>
                        {selectedClient.contractDetails?.strategyPeriod && (
                          <div>
                            <p className="text-xs text-muted-foreground">Strategy Period</p>
                            <p className="font-medium">{selectedClient.contractDetails.strategyPeriod}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Confidentiality Period</p>
                          <p className="font-medium">{selectedClient.contractDetails?.confidentialityPeriod || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground text-indigo-600">Digitally Signed Name</p>
                          <p className="font-medium text-indigo-700 font-serif italic">{selectedClient.contractSignature || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Signed At</p>
                          <p className="font-medium">
                            {selectedClient.contractSignedAt 
                              ? new Date(selectedClient.contractSignedAt).toLocaleString() 
                              : "-"}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedClient.contractStatus !== "signed" && (
                      <p className="text-xs text-muted-foreground border-t pt-3 mt-3">
                        This client has not signed their agreement yet. You can preview the exact terms they will see by clicking the <strong>Preview Draft Contract</strong> button.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 text-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Onboarding Details</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOnboardingViewClient(selectedClient)}
                        className="h-8 text-xs"
                      >
                        <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                        {selectedClient.onboardingCompleted ? "View Onboarding Responses" : "Preview Onboarding Forms"}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Onboarding Type</p>
                      <p className="font-medium text-slate-800">
                        {getOnboardingTypeDisplay(selectedClient)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Required Onboarding Forms</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {getRequiredOnboardingForms(selectedClient).map((formName, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-slate-200 text-slate-700">
                            {formName}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedClient.onboardingCompleted ? (
                      <p className="text-xs text-green-600 border-t pt-3 mt-3">
                        This client has completed all onboarding forms. Click the button above to view their responses.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground border-t pt-3 mt-3">
                        This client's onboarding is pending. You can preview the forms they will see or view any partially submitted responses by clicking the button above.
                      </p>
                    )}
                  </div>
                </div>

                {selectedClient.stripeCustomerId && !selectedClient.stripeCustomerId.startsWith("pending_") && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Stripe IDs</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm font-mono">{selectedClient.stripeCustomerId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedClient.stripeCustomerId, "modal-cus")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      {selectedClient.stripeSubscriptionId && (
                        <div className="flex items-center justify-between bg-muted p-2 rounded">
                          <span className="text-sm font-mono">{selectedClient.stripeSubscriptionId}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedClient.stripeSubscriptionId!, "modal-sub")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {selectedClient.subscriptionStatus === "pending_payment" ? (
                    <>
                      <Button
                        onClick={() => handleGenerateCheckoutLink(selectedClient)}
                        variant="outline"
                        disabled={generatingLink === selectedClient.id}
                      >
                        {generatingLink === selectedClient.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Link className="w-4 h-4 mr-2" />
                        )}
                        Copy Checkout Link
                      </Button>
                      <Button
                        onClick={() => handleEmailCheckoutLink(selectedClient)}
                        className="flex-1"
                        disabled={emailingCheckoutLink === selectedClient.id}
                      >
                        {emailingCheckoutLink === selectedClient.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Email Checkout Link
                      </Button>
                    </>
                  ) : selectedClient.subscriptionStatus === "active" && 
                     (!selectedClient.stripeSubscriptionId || selectedClient.stripeCustomerId?.startsWith("pending_")) ? (
                    <Button
                      onClick={() => handleMigrateToStripe(selectedClient)}
                      className="flex-1"
                      variant="outline"
                      disabled={migratingToStripe === selectedClient.id}
                    >
                      {migratingToStripe === selectedClient.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      Migrate to Stripe
                    </Button>
                  ) : selectedClient.stripeCustomerId && !selectedClient.stripeCustomerId.startsWith("pending_") ? (
                    <Button
                      onClick={() => openStripeCustomer(selectedClient.stripeCustomerId)}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in Stripe
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => handleSendLoginInvite(selectedClient)}
                    disabled={sendingEmail === selectedClient.id}
                  >
                    {sendingEmail === selectedClient.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Login Invite
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOnboardingViewClient(selectedClient)}
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    {selectedClient.onboardingCompleted ? "View Onboarding" : "Preview / View Onboarding"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Client Modal */}
        <EditClientModal
          open={!!editClient}
          onOpenChange={(open) => !open && setEditClient(null)}
          client={editClient}
          onClientUpdated={fetchClients}
        />

        {/* Delete Client Dialog */}
        <DeleteClientDialog
          open={!!deleteClient}
          onOpenChange={(open) => !open && setDeleteClient(null)}
          client={deleteClient}
          onClientDeleted={fetchClients}
        />

        {/* Onboarding Responses Modal */}
        <OnboardingResponsesModal
          open={!!onboardingViewClient}
          onOpenChange={(open) => !open && setOnboardingViewClient(null)}
          clientId={onboardingViewClient?.id || ""}
          clientName={onboardingViewClient?.clientName || onboardingViewClient?.email || "Client"}
        />
      </div>
    </div>
  );
};

export default AdminClients;