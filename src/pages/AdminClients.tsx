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
  LayoutDashboard,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { DeleteClientDialog } from "@/components/admin/DeleteClientDialog";
import { OnboardingResponsesModal } from "@/components/admin/OnboardingResponsesModal";
import { AdminShell } from "@/components/admin/AdminShell";
import { copyToClipboard as safeCopyToClipboard } from "@/lib/utils";

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
  onboardingStatus?: string;
  accountStatus?: string;
  subscriptions?: Array<{
    id: string;
    label: string;
    plan: string | null;
    selectedServices: string[];
    monthlyAmount: number;
    billingDay: number | null;
    nextBillingDate: string | null;
    subscriptionStatus: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    isPrimary: boolean;
    notes: string | null;
    contractStatus?: string;
    contractDetails?: any;
  }>;
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
  const [onboardingLinks, setOnboardingLinks] = useState<Record<string, string>>({});
  const [generatingOnboardingLink, setGeneratingOnboardingLink] = useState<string | null>(null);
  const [previewingBilling, setPreviewingBilling] = useState<string | null>(null);

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

  const isPartnershipClient = (client: Client) => {
    const email = (client.email || "").toLowerCase();
    const name = (client.clientName || "").toLowerCase();
    const cd = client.contractDetails || {};
    return (
      client.plan === "partnership" ||
      client.plan === "nda" ||
      cd.relationshipType === "partnership" ||
      cd.isNda === true ||
      cd.uploadedContractName?.includes("CONFIDENTIALITY")
    );
  };

  const isCommissionClient = (client: Client) => {
    const email = (client.email || "").toLowerCase();
    const name = (client.clientName || "").toLowerCase();
    const cd = client.contractDetails || {};
    return (
      email === "jordan@jordanellams.com" ||
      email === "michaelrrwilson@gmail.com" ||
      name.includes("jordan ellams") ||
      name.includes("michael wilson") ||
      cd.pricingModel === "commission" ||
      cd.uploadedContractName?.includes("IN THE DOME") ||
      cd.uploadedProposalName?.includes("IN THE DOME")
    );
  };

  const getStatusBadge = (client: Client) => {
    if (isPartnershipClient(client)) {
      if (client.contractStatus === "signed") {
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">
            Partner (NDA Active)
          </Badge>
        );
      }
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">
          Awaiting NDA
        </Badge>
      );
    }
    // Explicitly canceled subscription takes highest priority
    if (client.subscriptionStatus === "canceled") {
      return <Badge variant="destructive" className="whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">Canceled</Badge>;
    }
    if (client.subscriptionStatus === "past_due") {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">
          Past Due
        </Badge>
      );
    }
    if (client.subscriptionStatus === "pending_payment") {
      if (client.contractStatus === "not_signed" && client.plan !== "advertising") {
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">
            Awaiting Contract
          </Badge>
        );
      }
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">
          Awaiting Payment
        </Badge>
      );
    }
    if (client.contractStatus === "not_signed" && client.plan !== "advertising") {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">
          Awaiting Contract
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 whitespace-nowrap text-xs font-semibold px-2.5 py-0.5">
        Active
      </Badge>
    );
  };

  const getPlanDisplay = (plan: string | null, customPrice: number | null, selectedServices: string[] = [], client?: Client) => {
    if ((client && isPartnershipClient(client)) || plan === "partnership" || plan === "nda") {
      return "Partnership (Mutual NDA)";
    }
    if (plan === "prospect") {
      return "Prospect (Discovery)";
    }
    if (client && isCommissionClient(client)) {
      return "Custom (Commission-based)";
    }
    if (plan === "custom") {
      return "Custom Plan";
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
    if (plan === "partnership" || plan === "nda") return 0;
    if (plan === "custom" && customPrice !== null && customPrice !== undefined) return customPrice;
    if (plan === "custom" || plan === "prospect") return 0;
    
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
    
    if (plan === "prospect") {
      return "prospect";
    }
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
    if (client.email === "sam@hairtamin.com") {
      return "Custom SEO/AEO Discovery Onboarding";
    }
    const type = getOnboardingType(client);
    switch (type) {
      case "prospect":
        return client.plan === "prospect" ? "Prospect Discovery Onboarding" : "General Discovery Onboarding";
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
    if (client.email === "sam@hairtamin.com") {
      return ["Discovery Questionnaire", "SEO/AEO Discovery"];
    }

    const type = getOnboardingType(client);
    if (type === "prospect") {
      return ["General Discovery Questionnaire"];
    }
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
    const success = await safeCopyToClipboard(text);
    if (success) {
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.info("Link generated. You can select and copy it manually.");
    }
  };

  const openStripeCustomer = (customerId: string) => {
    window.open(`https://dashboard.stripe.com/customers/${customerId}`, "_blank");
  };

  const handlePreviewBilling = async (client: Client) => {
    if (previewingBilling) return;
    setPreviewingBilling(client.id);
    try {
      const response = await supabase.functions.invoke("create-customer-portal-session", {
        body: { email: client.email },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);
      window.open(response.data.url, "_blank");
      toast.success("Billing portal opened in new tab");
    } catch (error: any) {
      console.error("Error opening billing preview:", error);
      toast.error(error.message || "Failed to open billing portal");
    } finally {
      setPreviewingBilling(null);
    }
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
      const copied = await safeCopyToClipboard(checkoutUrl);
      if (copied) {
        toast.success("Checkout link copied to clipboard!");
      } else {
        toast.success("Checkout link generated!");
      }
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
      const copied = await safeCopyToClipboard(checkoutUrl);
      if (copied) {
        toast.success("Migration checkout link copied! Send to client to complete Stripe setup.");
      } else {
        toast.success("Migration link generated!");
      }
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

      if (response.error) {
        let errMsg = response.error.message;
        try {
          const errorContext = (response.error as any).context;
          if (errorContext && typeof errorContext.json === "function") {
            const body = await errorContext.json();
            if (body?.error) errMsg = body.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      if (response.data?.error) throw new Error(response.data.error);

      if (response.data?.loginUrl) {
        setOnboardingLinks((prev) => ({ ...prev, [client.id]: response.data.loginUrl }));
        const copied = await safeCopyToClipboard(response.data.loginUrl);
        if (copied) {
          toast.success("1-Click Onboarding Link copied to clipboard for " + client.email);
        } else {
          toast.success("1-Click link created for " + client.email);
        }
      } else {
        toast.success("Login invite processed for " + client.email);
      }
    } catch (error: any) {
      console.error("Error sending login invite:", error);
      toast.error(error.message || "Failed to send login invite");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleGenerateOnboardingLink = async (client: Client) => {
    if (generatingOnboardingLink) return;
    
    setGeneratingOnboardingLink(client.id);
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

      if (response.error) {
        let errMsg = response.error.message;
        try {
          const errorContext = (response.error as any).context;
          if (errorContext && typeof errorContext.json === "function") {
            const body = await errorContext.json();
            if (body?.error) errMsg = body.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      if (response.data?.error) throw new Error(response.data.error);

      const generatedUrl = response.data?.loginUrl;
      if (generatedUrl) {
        setOnboardingLinks((prev) => ({ ...prev, [client.id]: generatedUrl }));
        const copied = await safeCopyToClipboard(generatedUrl);
        if (copied) {
          toast.success("1-Click Onboarding Link copied to clipboard!");
        } else {
          toast.success("1-Click Onboarding Link generated!");
        }
      } else {
        toast.success(response.data?.message || "Link generated");
      }
    } catch (error: any) {
      console.error("Error generating onboarding link:", error);
      toast.error(error.message || "Failed to generate onboarding link");
    } finally {
      setGeneratingOnboardingLink(null);
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
    <AdminShell
      title="Client Directory"
      description="Manage subscriptions, contracts, onboarding, and Stripe mappings"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Clients" }]}
      actions={
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs border-border text-foreground hover:bg-muted gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>Templates</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 text-xs">
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
          <Button
            onClick={fetchClients}
            variant="outline"
            size="sm"
            disabled={loading}
            className="h-8 text-xs border-border text-foreground hover:bg-muted"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => navigate("/admin/create-client")}
            size="sm"
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add Client
          </Button>
        </div>
      }
    >

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
        >
          <div className="bg-white dark:bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </div>
          <div className="bg-white dark:bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Awaiting Payment</p>
            <p className="text-2xl font-bold text-orange-600">
              {clients.filter((c) => c.subscriptionStatus === "pending_payment").length}
            </p>
          </div>
          <div className="bg-white dark:bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {clients.filter((c) => c.isActive && c.subscriptionStatus === "active").length}
            </p>
          </div>
          <div className="bg-white dark:bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Custom Plans</p>
            <p className="text-2xl font-bold text-primary">
              {clients.filter((c) => c.plan === "custom").length}
            </p>
          </div>
          <div className="bg-white dark:bg-card p-4 rounded-xl border shadow-sm">
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
          className="bg-white dark:bg-card p-4 rounded-xl border shadow-sm mb-6"
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
                <SelectItem value="partnership">Partnership (NDA)</SelectItem>
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
          className="bg-white dark:bg-card rounded-xl border shadow-sm overflow-hidden"
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
                  <TableHead className="min-w-[220px]">Client</TableHead>
                  <TableHead className="min-w-[170px]">Plan & Pricing</TableHead>
                  <TableHead className="min-w-[150px]">Status</TableHead>
                  <TableHead className="min-w-[180px]">Services</TableHead>
                  <TableHead className="min-w-[110px]">Subscribed</TableHead>
                  <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const isPartnership = isPartnershipClient(client);
                  const isComm = isCommissionClient(client);
                  const subsCount = client.subscriptions?.length ?? 0;
                  const total = subsCount > 0
                    ? client.subscriptions!.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0)
                    : getMonthlyPrice(client.plan, client.customPrice, client.selectedServices);

                  return (
                    <TableRow key={client.id} className="hover:bg-muted/40 transition-colors">
                      {/* Client Identity */}
                      <TableCell
                        className="cursor-pointer group py-3"
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 text-sm">
                            {client.clientName || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {client.email || "No email"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Plan & Pricing */}
                      <TableCell className="py-3">
                        {isPartnership ? (
                          <div className="space-y-1">
                            <p className="font-medium text-foreground text-xs whitespace-nowrap">Strategic Partnership</p>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[11px] font-medium whitespace-nowrap">
                              Mutual NDA ($0/mo)
                            </Badge>
                          </div>
                        ) : isComm ? (
                          <div className="space-y-1">
                            <p className="font-medium text-foreground text-xs whitespace-nowrap">Performance Agreement</p>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[11px] font-medium whitespace-nowrap">
                              100% Commission
                            </Badge>
                          </div>
                        ) : subsCount > 1 ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground text-xs whitespace-nowrap">${total.toLocaleString()}/mo</p>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-[11px] font-medium whitespace-nowrap">
                              {subsCount} Active Subscriptions
                            </Badge>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground text-xs whitespace-nowrap">${total.toLocaleString()}/mo</p>
                            <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {getPlanDisplay(client.plan, client.customPrice, client.selectedServices, client)}
                            </p>
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        {getStatusBadge(client)}
                      </TableCell>

                      {/* Services */}
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {(() => {
                            const rawServices = (client.subscriptions?.length ?? 0) > 0
                              ? client.subscriptions!.flatMap((s) => s.selectedServices || [])
                              : (client.selectedServices || []);
                            const allServices = Array.from(new Set(rawServices));
                            if (allServices.length > 0) {
                              return (
                                <>
                                  {allServices.slice(0, 2).map((service, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-[11px] px-2 py-0.5 whitespace-nowrap font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/60 capitalize"
                                    >
                                      {service.replace(/^channel-/, "").replace(/-/g, " ")}
                                    </Badge>
                                  ))}
                                  {allServices.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0.5 whitespace-nowrap font-medium text-muted-foreground border-border bg-muted/40"
                                    >
                                      +{allServices.length - 2}
                                    </Badge>
                                  )}
                                </>
                              );
                            }
                            return <span className="text-muted-foreground text-xs">None</span>;
                          })()}
                        </div>
                      </TableCell>

                      {/* Subscribed Date */}
                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </TableCell>

                      {/* Streamlined Grouped Actions */}
                      <TableCell className="text-right py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Primary CTA: Dedicated Client Workspace */}
                          <Button
                            size="sm"
                            onClick={() => navigate(`/admin/clients/${client.id}`)}
                            title="Open Dedicated Client Workspace"
                            className="h-8 px-2.5 text-xs font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Workspace</span>
                          </Button>

                          {/* Quick Details (Modal Fallback) */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClient(client)}
                            title="Quick Details (Modal Preview)"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground border-border"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Grouped More Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                title="More client actions"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground border-border"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 text-xs">
                              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Client Access
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleGenerateOnboardingLink(client)}
                                className="gap-2 cursor-pointer"
                              >
                                <Link className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{onboardingLinks[client.id] ? "Copy 1-Click Link" : "Generate 1-Click Link"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSendLoginInvite(client)}
                                className="gap-2 cursor-pointer"
                              >
                                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Send Email Invite</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Billing & Payments
                              </DropdownMenuLabel>
                              {client.subscriptionStatus === "pending_payment" && !isPartnership && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleGenerateCheckoutLink(client)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Link className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Copy Checkout Link</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEmailCheckoutLink(client)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5 text-cyan-500" />
                                    <span>Email Checkout Link</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {client.stripeCustomerId && !client.stripeCustomerId.startsWith("pending_") ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => openStripeCustomer(client.stripeCustomerId)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>View in Stripe</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handlePreviewBilling(client)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Preview Billing Portal</span>
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleMigrateToStripe(client)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Migrate to Stripe</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Agreements & Onboarding
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => window.open(`/contract?clientId=${client.id}`, "_blank")}
                                className="gap-2 cursor-pointer"
                              >
                                <FileSignature className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{client.contractStatus === "signed" ? "View Contract" : "Open Signing Page"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setOnboardingViewClient(client)}
                                className="gap-2 cursor-pointer"
                              >
                                <ClipboardList className="w-3.5 h-3.5 text-purple-500" />
                                <span>{client.onboardingCompleted ? "View Onboarding Responses" : "Preview Onboarding"}</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Administration
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setEditClient(client)}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Edit Profile...</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteClient(client)}
                                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                <span>Delete Client...</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </motion.div>

        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>Client Details</DialogTitle>
              {selectedClient && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/dashboard?clientId=${selectedClient.id}`, "_blank")}
                  className="h-8 text-xs font-medium rounded-lg border-border/80 hover:border-slate-400 dark:hover:border-slate-600 bg-background hover:bg-muted/60 shadow-2xs active:scale-[0.98] transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  Preview Dashboard
                </Button>
              )}
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
                  {(() => {
                    const hasSubs = (selectedClient.subscriptions?.length ?? 0) > 0;
                    const combinedAmount = hasSubs
                      ? selectedClient.subscriptions!.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0)
                      : getMonthlyPrice(selectedClient.plan, selectedClient.customPrice, selectedClient.selectedServices);
                    const allActive = hasSubs && selectedClient.subscriptions!.every(s => s.subscriptionStatus === "active");
                    const anyActive = hasSubs && selectedClient.subscriptions!.some(s => s.subscriptionStatus === "active");
                    const allSigned = hasSubs && selectedClient.subscriptions!.every(s => s.contractStatus === "signed");
                    const anySigned = hasSubs && selectedClient.subscriptions!.some(s => s.contractStatus === "signed");
                    const totalServices = hasSubs
                      ? selectedClient.subscriptions!.reduce((sum, s) => sum + (s.selectedServices?.length || 0), 0)
                      : (selectedClient.maxServices || 1);
                    return (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Plan</p>
                          <p className="font-medium">
                            {getPlanDisplay(selectedClient.plan, selectedClient.customPrice, selectedClient.selectedServices, selectedClient)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Price</p>
                          <p className="font-medium">
                            {isPartnershipClient(selectedClient) ? (
                              <span className="text-purple-700 font-semibold">$0.00 (Strategic Partnership)</span>
                            ) : isCommissionClient(selectedClient) ? (
                              <span className="text-emerald-700 font-semibold">Commission-Based</span>
                            ) : (
                              `$${combinedAmount.toLocaleString()}`
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div className="mt-1">
                            {hasSubs ? (
                              allActive
                                ? <Badge className="bg-green-100 text-green-700">Active</Badge>
                                : anyActive
                                  ? <Badge className="bg-yellow-100 text-yellow-700">Partially Active</Badge>
                                  : <Badge className="bg-orange-100 text-orange-700">Awaiting Payment</Badge>
                            ) : (
                              getStatusBadge(selectedClient)
                            )}
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
                          <p className="text-sm text-muted-foreground">{isPartnershipClient(selectedClient) ? "NDA Status" : "Contract"}</p>
                          <div className="mt-1">
                            {hasSubs ? (
                              allSigned
                                ? <Badge className="bg-green-100 text-green-700">All Signed</Badge>
                                : anySigned
                                  ? <Badge className="bg-yellow-100 text-yellow-700">Partially Signed</Badge>
                                  : <Badge variant="outline" className="text-muted-foreground">Not Signed</Badge>
                            ) : (
                              selectedClient.contractStatus === "signed"
                                ? <Badge className="bg-green-100 text-green-700">{isPartnershipClient(selectedClient) ? "NDA Signed" : "Signed"}</Badge>
                                : <Badge variant="outline" className="text-muted-foreground">{isPartnershipClient(selectedClient) ? "NDA Pending" : "Not Signed"}</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{hasSubs ? "Total Services" : "Max Services"}</p>
                          <p className="font-medium">{totalServices}</p>
                        </div>
                      </>
                    );
                  })()}
                  <div>
                    <p className="text-sm text-muted-foreground">Subscribed</p>
                    <p className="font-medium">
                      {new Date(selectedClient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Subscriptions & Services */}
                {(selectedClient.subscriptions?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-semibold">Subscriptions ({selectedClient.subscriptions!.length})</p>
                    {selectedClient.subscriptions!.map((sub, idx) => (
                      <div key={sub.id || idx} className={`border rounded-lg p-3 space-y-2 ${sub.isPrimary ? "border-primary/40 bg-primary/5" : ""}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{sub.label}</p>
                            {sub.isPrimary && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                          </div>
                          {isCommissionClient(selectedClient) && sub.monthlyAmount === 0 ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                              Commission-Based
                            </Badge>
                          ) : (
                            <p className="font-semibold text-sm">${sub.monthlyAmount.toLocaleString()}/mo</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {sub.billingDay && <span>Bills on the {sub.billingDay}{sub.billingDay === 1 ? "st" : sub.billingDay === 2 ? "nd" : sub.billingDay === 3 ? "rd" : "th"}</span>}
                          <span>•</span>
                          <Badge variant={sub.subscriptionStatus === "active" ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                            {sub.subscriptionStatus === "pending_payment" ? "Awaiting Payment" : sub.subscriptionStatus}
                          </Badge>
                          <span>•</span>
                          <span>Contract: {sub.contractStatus === "signed" ? "✅ Signed" : "⏳ Not Signed"}</span>
                        </div>
                        {sub.notes && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">{sub.notes}</p>
                        )}
                        {sub.selectedServices && sub.selectedServices.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {sub.selectedServices.map((svc, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{svc}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm font-medium">Combined Monthly Total</span>
                      <span className="font-bold">
                        {isCommissionClient(selectedClient) && selectedClient.subscriptions!.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0) === 0 ? (
                          <span className="text-emerald-700">Commission-Based</span>
                        ) : (
                          `$${selectedClient.subscriptions!.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0).toLocaleString()}/mo`
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
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
                )}


                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Contract & Proposal Details</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedClient.contractDetails?.uploadedProposalUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(selectedClient.contractDetails.uploadedProposalUrl, "_blank")}
                          className="h-8 text-xs font-medium rounded-lg border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-2xs active:scale-[0.98] transition-all"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          View Proposal PDF
                        </Button>
                      )}
                      {selectedClient.contractStatus === "signed" ? (
                        <>
                          {selectedClient.contractDetails?.uploadedContractUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(selectedClient.contractDetails.uploadedContractUrl, "_blank")}
                              className="h-8 text-xs font-medium rounded-lg border-border/80 hover:border-slate-400 dark:hover:border-slate-600 bg-background hover:bg-muted/60 shadow-2xs active:scale-[0.98] transition-all"
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              Download Original Contract
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/contract?view=true&clientId=${selectedClient.id}`, "_blank")}
                            className="h-8 text-xs font-medium rounded-lg border-border/80 hover:border-slate-400 dark:hover:border-slate-600 bg-background hover:bg-muted/60 shadow-2xs active:scale-[0.98] transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View Signed Web Contract
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="h-8 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-[0.98] transition-all"
                            onClick={() => window.open(`/contract?clientId=${selectedClient.id}`, "_blank")}
                          >
                            <FileSignature className="w-3.5 h-3.5 mr-1.5" />
                            Open Client Sign Page
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/contract?view=true&clientId=${selectedClient.id}`, "_blank")}
                            className="h-8 text-xs font-medium rounded-lg border-border/80 hover:border-slate-400 dark:hover:border-slate-600 bg-background hover:bg-muted/60 shadow-2xs active:scale-[0.98] transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            Preview Draft Contract
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-3">
                    {selectedClient.contractDetails?.uploadedProposalUrl && (
                      <div className="border-b pb-3 mb-2">
                        <p className="text-xs text-muted-foreground">Attached Proposal Document</p>
                        <p className="font-medium text-indigo-700 dark:text-indigo-300">
                          {selectedClient.contractDetails.uploadedProposalName || "Proposal PDF"}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Contract Template Type</p>
                      <p className="font-medium">
                        {selectedClient.contractDetails?.uploadedContractUrl
                          ? `Custom Upload: ${selectedClient.contractDetails.uploadedContractName || "Uploaded PDF"}`
                          : (selectedClient.plan === "amazon" || 
                             selectedClient.selectedServices.includes("channel-amazon") || 
                             selectedClient.selectedServices.includes("amazon-design"))
                          ? "Business Agreement for Amazon Advertising Services"
                          : "Client Service Agreement"}
                      </p>
                    </div>

                    {(selectedClient.contractDetails?.setupFee || selectedClient.contractDetails?.compensationStructure) && (
                      <div className="border-t pt-3 space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compensation Terms</p>
                        {selectedClient.contractDetails?.monthlyFee && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Monthly Admin Fee:</span>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{selectedClient.contractDetails.monthlyFee}</span>
                          </div>
                        )}
                        {selectedClient.contractDetails?.setupFee && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Setup Fee:</span>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{selectedClient.contractDetails.setupFee}</span>
                          </div>
                        )}
                        {selectedClient.contractDetails?.commissionTerms && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Commissions:</span>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{selectedClient.contractDetails.commissionTerms}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedClient.contractStatus === "signed" && (
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
                          <p className="text-xs text-muted-foreground">Initial Term</p>
                          <p className="font-medium">{selectedClient.contractDetails?.initialTerm || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Notice Period</p>
                          <p className="font-medium">{selectedClient.contractDetails?.noticePeriod || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Billing Terms</p>
                          <p className="font-medium">{selectedClient.contractDetails?.billingTerms || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Service Delivery</p>
                          <p className="font-medium">{selectedClient.contractDetails?.serviceDelivery || "-"}</p>
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
                      <div className="border-t pt-3 mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          This client has not signed their agreement yet. You can share this direct signing link or open it directly:
                        </p>
                        <div className="flex gap-2 items-center">
                          <code className="flex-1 text-xs bg-white dark:bg-background p-2 rounded-lg border text-indigo-950 dark:text-indigo-100 font-mono break-all">
                            {`${window.location.origin}/contract?clientId=${selectedClient.id}`}
                          </code>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(`${window.location.origin}/contract?clientId=${selectedClient.id}`, "modal-contract-link")}
                            className="h-8 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 shrink-0"
                          >
                            {copiedId === "modal-contract-link" ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Onboarding Details</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOnboardingViewClient(selectedClient)}
                        className="h-8 text-xs font-medium rounded-lg border-border/80 hover:border-slate-400 dark:hover:border-slate-600 bg-background hover:bg-muted/60 shadow-2xs active:scale-[0.98] transition-all"
                      >
                        <ClipboardList className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                        {selectedClient.onboardingCompleted ? "View Onboarding Responses" : "Preview Onboarding Forms"}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Onboarding Type</p>
                      <p className="font-medium">
                        {getOnboardingTypeDisplay(selectedClient)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Required Onboarding Forms</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {getRequiredOnboardingForms(selectedClient).map((formName, idx) => (
                          <Badge key={idx} variant="secondary">
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

                <div className="border-t pt-5">
                  <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                          <span>1-Click Client Access & Onboarding Link</span>
                          <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            Instant Setup
                          </span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Single setup URL: Sign Up ➔ Contract ➔ Payment ➔ Onboarding Access
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-8 px-3.5 rounded-lg shadow-xs active:scale-[0.98] transition-all self-start sm:self-auto"
                        onClick={() => handleGenerateOnboardingLink(selectedClient)}
                        disabled={generatingOnboardingLink === selectedClient.id}
                      >
                        {generatingOnboardingLink === selectedClient.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : onboardingLinks[selectedClient.id] ? (
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        ) : (
                          <Link className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {onboardingLinks[selectedClient.id] ? "Regenerate Link" : "Generate 1-Click Link"}
                      </Button>
                    </div>

                    {onboardingLinks[selectedClient.id] ? (
                      <div className="bg-background border border-border rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Link className="w-3.5 h-3.5 text-primary" />
                            Active 1-Click URL
                          </span>
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                            Sign Up ➔ Contract ➔ Payment ➔ Access
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <code className="flex-1 text-xs bg-muted/50 p-2.5 rounded-md border border-border text-foreground font-mono break-all max-h-20 overflow-y-auto select-all">
                            {onboardingLinks[selectedClient.id]}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(onboardingLinks[selectedClient.id], "modal-onboarding-link")}
                            className="h-9 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-md shadow-2xs active:scale-[0.98] transition-all"
                          >
                            {copiedId === "modal-onboarding-link" ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-9 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-md shadow-2xs active:scale-[0.98] transition-all"
                            onClick={() => window.open(onboardingLinks[selectedClient.id], "_blank")}
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                            <span>Open</span>
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Send this single link directly to your client via Slack, SMS, or email.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-background border border-border/80 p-3 rounded-lg text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                        <span className="leading-relaxed text-slate-600 dark:text-slate-300">
                          Generate a single 1-Click link for this client to easily send over Slack, SMS, or Email.
                        </span>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-8 px-3.5 rounded-md shadow-2xs active:scale-[0.98] transition-all shrink-0"
                          onClick={() => handleGenerateOnboardingLink(selectedClient)}
                          disabled={generatingOnboardingLink === selectedClient.id}
                        >
                          {generatingOnboardingLink === selectedClient.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Link className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Generate Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedClient.stripeCustomerId && !selectedClient.stripeCustomerId.startsWith("pending_") && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Stripe Identifiers</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center justify-between bg-muted/40 hover:bg-muted/60 border border-border/60 p-2.5 rounded-lg transition-colors">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Customer ID</p>
                          <span className="text-xs font-mono font-medium truncate block text-foreground">{selectedClient.stripeCustomerId}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-md hover:bg-background border border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => copyToClipboard(selectedClient.stripeCustomerId, "modal-cus")}
                          title="Copy Customer ID"
                        >
                          {copiedId === "modal-cus" ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {selectedClient.stripeSubscriptionId && (
                        <div className="flex items-center justify-between bg-muted/40 hover:bg-muted/60 border border-border/60 p-2.5 rounded-lg transition-colors">
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Subscription ID</p>
                            <span className="text-xs font-mono font-medium truncate block text-foreground">{selectedClient.stripeSubscriptionId}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-md hover:bg-background border border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => copyToClipboard(selectedClient.stripeSubscriptionId!, "modal-sub")}
                            title="Copy Subscription ID"
                          >
                            {copiedId === "modal-sub" ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {selectedClient.subscriptionStatus === "pending_payment" ? (
                      <>
                        <Button
                          onClick={() => handleGenerateCheckoutLink(selectedClient)}
                          variant="outline"
                          disabled={generatingLink === selectedClient.id}
                          className="h-10 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          {generatingLink === selectedClient.id ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <Link className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <span className="truncate">Copy Checkout Link</span>
                        </Button>
                        <Button
                          onClick={() => handleEmailCheckoutLink(selectedClient)}
                          disabled={emailingCheckoutLink === selectedClient.id}
                          className="h-10 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg shadow-xs hover:shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          {emailingCheckoutLink === selectedClient.id ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <Send className="w-4 h-4 shrink-0" />
                          )}
                          <span className="truncate">Email Checkout</span>
                        </Button>
                      </>
                    ) : selectedClient.subscriptionStatus === "active" && 
                       (!selectedClient.stripeSubscriptionId || selectedClient.stripeCustomerId?.startsWith("pending_")) ? (
                      <Button
                        onClick={() => handleMigrateToStripe(selectedClient)}
                        variant="outline"
                        disabled={migratingToStripe === selectedClient.id}
                        className="h-10 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        {migratingToStripe === selectedClient.id ? (
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <span className="truncate">Migrate to Stripe</span>
                      </Button>
                    ) : selectedClient.stripeCustomerId && !selectedClient.stripeCustomerId.startsWith("pending_") ? (
                      <>
                        <Button
                          onClick={() => openStripeCustomer(selectedClient.stripeCustomerId)}
                          variant="outline"
                          className="h-10 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">View in Stripe</span>
                        </Button>
                        <Button
                          onClick={() => handlePreviewBilling(selectedClient)}
                          variant="outline"
                          disabled={previewingBilling === selectedClient.id}
                          className="h-10 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          {previewingBilling === selectedClient.id ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <Eye className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <span className="truncate">Preview Billing</span>
                        </Button>
                      </>
                    ) : null}

                    <Button
                      variant="outline"
                      className="h-10 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      onClick={() => handleGenerateOnboardingLink(selectedClient)}
                      disabled={generatingOnboardingLink === selectedClient.id}
                    >
                      {generatingOnboardingLink === selectedClient.id ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Link className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className="truncate">{onboardingLinks[selectedClient.id] ? "Copy 1-Click Link" : "Generate 1-Click Link"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleSendLoginInvite(selectedClient)}
                      disabled={sendingEmail === selectedClient.id}
                      className="h-10 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {sendingEmail === selectedClient.id ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className="truncate">Send Email Invite</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setOnboardingViewClient(selectedClient)}
                      className="h-10 px-3 bg-background hover:bg-muted border border-border text-foreground font-medium text-xs rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{selectedClient.onboardingCompleted ? "View Onboarding" : "Preview Forms"}</span>
                    </Button>
                  </div>
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
    </AdminShell>
  );
};

export default AdminClients;