import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CalendarDays, X, Sparkles, User, Layers, CreditCard, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const automationServices = [
  { id: "social-media-suite", label: "Social Media Suite", price: 2450 },
  { id: "ecommerce-operations", label: "E-Commerce Operations", price: 888 },
  { id: "custom-website", label: "Custom Website Development", price: 888 },
  { id: "seo-aeo", label: "SEO/AEO Package", price: 888 },
  { id: "custom-lms", label: "Custom LMS Package", price: 2450 },
  { id: "custom-gpt", label: "Custom GPT Product", price: 888 },
  { id: "custom-tool", label: "Custom Tool", price: 888 },
  { id: "custom-ai-assistant", label: "Custom AI Assistant", price: 888 },
  { id: "custom-agent", label: "Custom Agent", price: 888 },
  { id: "custom-project-management", label: "Custom Project Management System", price: 888 },
  { id: "custom-data-dashboard", label: "Custom Data Dashboard", price: 888 },
  { id: "advertising-package", label: "Advertising", price: 999 },
];

const advertisingChannels = [
  { id: "channel-google", label: "Google Ads" },
  { id: "channel-meta", label: "Meta (Facebook/Instagram)" },
  { id: "channel-tiktok", label: "TikTok Ads" },
  { id: "channel-linkedin", label: "LinkedIn Ads" },
  { id: "channel-youtube", label: "YouTube Ads" },
  { id: "channel-pinterest", label: "Pinterest Ads" },
  { id: "channel-x", label: "X (Twitter) Ads" },
  { id: "channel-amazon", label: "Amazon Ads" },
];

const planConfigs: Record<string, { amount: number; maxServices: number }> = {
  single: { amount: 888, maxServices: 1 },
  triple: { amount: 2664, maxServices: 3 },
  full: { amount: 3996, maxServices: 6 },
  amazon: { amount: 999, maxServices: 1 },
  advertising: { amount: 999, maxServices: 7 },
  custom: { amount: 0, maxServices: 6 },
};

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
  contractStatus?: string;
  onboardingStatus?: string;
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
  }>;
}

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onClientUpdated: () => void;
  initialTab?: "services" | "profile" | "billing";
}

export const EditClientModal = ({
  open,
  onOpenChange,
  client,
  onClientUpdated,
  initialTab = "profile",
}: EditClientModalProps) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const [loading, setLoading] = useState(false);
  const [additionalEmails, setAdditionalEmails] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [existingContractName, setExistingContractName] = useState<string | null>(null);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [existingProposalName, setExistingProposalName] = useState<string | null>(null);
  const [contractTerms, setContractTerms] = useState({
    initialTerm: "6 months",
    noticePeriod: "30 days",
    billingTerms: "Initial payment due upon full execution; recurring invoices monthly from Effective Date",
    serviceDelivery: "Remote unless otherwise agreed in writing",
  });
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    plan: "single" as string,
    monthlyAmount: 888,
    maxServices: 1,
    selectedServices: [] as string[],
    subscriptionStatus: "pending_payment" as string,
    isActive: true,
    notes: "",
    contractStatus: "not_signed" as string,
  });

  interface SubscriptionFormItem {
    id?: string; // existing DB id (undefined for new)
    label: string;
    plan: string;
    monthlyAmount: number;
    billingDay: number | null;
    subscriptionStatus: string;
    isPrimary: boolean;
    selectedServices: string[];
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    notes: string;
    contractStatus: string;
    contractDetails: any;
  }

  const [clientSubscriptions, setClientSubscriptions] = useState<SubscriptionFormItem[]>([]);
  const [customServices, setCustomServices] = useState<{ id: string; label: string; price?: number }[]>([]);
  const [customServiceName, setCustomServiceName] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);

  const handleAddCustomService = () => {
    const trimmed = customServiceName.trim();
    if (!trimmed) return;

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      toast.error("Please enter a valid service name");
      return;
    }

    const allKnownIds = [
      ...automationServices.map((s) => s.id),
      ...advertisingChannels.map((c) => c.id),
      ...customServices.map((s) => s.id),
    ];

    if (allKnownIds.includes(slug)) {
      toast.error("A service with this name or slug already exists");
      return;
    }

    const newService = { id: slug, label: trimmed, price: 888 };
    setCustomServices((prev) => [...prev, newService]);

    let canSelect = false;
    if (formData.plan === "custom") {
      const max = parseInt(formData.maxServices as any) || 0;
      const currentGeneralCount = formData.selectedServices.filter((s) => !s.startsWith("channel-")).length;
      canSelect = currentGeneralCount < max;
    } else {
      const max = planConfigs[formData.plan]?.maxServices || 1;
      const currentCount = formData.plan === "advertising"
        ? formData.selectedServices.filter((s) => s.startsWith("channel-")).length
        : formData.selectedServices.length;
      canSelect = currentCount < max;
    }

    if (canSelect) {
      setFormData((prev) => ({
        ...prev,
        selectedServices: [...prev.selectedServices, slug],
      }));
      toast.success(`Custom service "${trimmed}" added and selected!`);
    } else {
      toast.success(`Custom service "${trimmed}" added to available services!`);
    }

    setCustomServiceName("");
    setShowAddCustom(false);
  };

  const handleRemoveCustomService = (serviceId: string) => {
    setCustomServices((prev) => prev.filter((s) => s.id !== serviceId));
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.filter((id) => id !== serviceId),
    }));
    setClientSubscriptions((prev) =>
      prev.map((sub) => ({
        ...sub,
        selectedServices: (sub.selectedServices || []).filter((id) => id !== serviceId),
      }))
    );
    toast.info("Custom service removed");
  };

  useEffect(() => {
    if (client) {
      // Use the explicitly stored plan; only auto-detect as fallback when plan is missing
      let detectedPlan = client.plan || "single";
      if (!client.plan) {
        if (client.selectedServices?.includes("amazon-design")) detectedPlan = "amazon";
        if (client.selectedServices?.some(s => s.startsWith("channel-"))) detectedPlan = "advertising";
      }

      // Extract additional emails from notes
      const notesStr = client.notes || "";
      const match = notesStr.match(/^\[Additional Emails:\s*([^\]]*)\]\n?/i);
      let extractedEmails = "";
      let remainingNotes = notesStr;
      if (match) {
        extractedEmails = match[1];
        remainingNotes = notesStr.substring(match[0].length);
      }

      setAdditionalEmails(extractedEmails);

      setFormData({
        clientName: client.clientName || "",
        email: client.email || "",
        plan: detectedPlan,
        monthlyAmount: client.customPrice || planConfigs[detectedPlan]?.amount || 888,
        maxServices: client.maxServices || planConfigs[detectedPlan]?.maxServices || 1,
        selectedServices: client.selectedServices || [],
        subscriptionStatus: client.subscriptionStatus || "pending_payment",
        isActive: client.isActive,
        notes: remainingNotes,
        contractStatus: client.contractStatus || "not_signed",
      });

      // Load existing contract name and terms if available
      const cd = (client as any).contractDetails || {};
      setExistingContractName(cd.uploadedContractName || null);
      setExistingProposalName(cd.uploadedProposalName || null);
      setContractTerms({
        initialTerm: cd.initialTerm || "6 months",
        noticePeriod: cd.noticePeriod || "30 days",
        billingTerms: cd.billingTerms || "Initial payment due upon full execution; recurring invoices monthly from Effective Date",
        serviceDelivery: cd.serviceDelivery || "Remote unless otherwise agreed in writing",
      });
      setContractFile(null);
      setProposalFile(null);

      // Initialize subscriptions
      setClientSubscriptions(
        (client.subscriptions || []).map((s) => ({
          id: s.id,
          label: s.label || "",
          plan: s.plan || "custom",
          monthlyAmount: s.monthlyAmount || 0,
          billingDay: s.billingDay || null,
          subscriptionStatus: s.subscriptionStatus || "active",
          isPrimary: s.isPrimary || false,
          selectedServices: s.selectedServices || [],
          stripeSubscriptionId: s.stripeSubscriptionId || "",
          stripeCustomerId: s.stripeCustomerId || "",
          notes: s.notes || "",
          contractStatus: s.contractStatus || "not_signed",
          contractDetails: s.contractDetails || null,
        }))
      );

      // Auto-detect any existing custom services already on this client profile or subscriptions
      const predefinedIds = new Set([
        ...automationServices.map((s) => s.id),
        ...advertisingChannels.map((c) => c.id),
      ]);

      const detectedCustom: { id: string; label: string; price?: number }[] = [];
      const seen = new Set<string>();

      const addIfCustom = (id: string) => {
        if (!predefinedIds.has(id) && !seen.has(id)) {
          seen.add(id);
          detectedCustom.push({
            id,
            label: id.replace(/^channel-/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            price: 888,
          });
        }
      };

      (client.selectedServices || []).forEach(addIfCustom);
      (client.subscriptions || []).forEach((sub) => {
        (sub.selectedServices || []).forEach(addIfCustom);
      });

      setCustomServices(detectedCustom);
    }
  }, [client]);

  const handlePlanChange = (plan: string) => {
    const config = planConfigs[plan] || planConfigs.single;
    setFormData((prev) => ({
      ...prev,
      plan,
      monthlyAmount: plan === "custom" ? prev.monthlyAmount : config.amount,
      maxServices: plan === "custom" ? prev.maxServices : config.maxServices,
      // Reset services when switching plan types
      selectedServices: plan === "amazon" ? ["amazon-design"] : [],
    }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => {
      if (prev.selectedServices.includes(serviceId)) {
        return {
          ...prev,
          selectedServices: prev.selectedServices.filter((s) => s !== serviceId),
        };
      }
      
      const isAdvertisingChannel = serviceId.startsWith("channel-");
      
      if (prev.plan === "custom") {
        if (!isAdvertisingChannel) {
          const maxAllowed = parseInt(prev.maxServices as any) || 0;
          const currentGeneralCount = prev.selectedServices.filter(s => !s.startsWith("channel-")).length;
          if (currentGeneralCount >= maxAllowed) {
            toast.error(`Maximum ${maxAllowed} general services allowed`);
            return prev;
          }
        }
      } else {
        const maxAllowed = planConfigs[prev.plan].maxServices;
        const currentCount = prev.plan === "advertising"
          ? prev.selectedServices.filter(s => s.startsWith("channel-")).length
          : prev.selectedServices.length;
        if (currentCount >= maxAllowed) {
          toast.error(`Maximum ${maxAllowed} selections allowed for this plan`);
          return prev;
        }
      }
      return { ...prev, selectedServices: [...prev.selectedServices, serviceId] };
    });
  };

  const getAdvertisingPrice = (channelCount: number) => {
    if (channelCount <= 0) return 0;
    if (channelCount < 3) return channelCount * 999;
    return Math.min(channelCount * 493, 3450);
  };

  const getDisplayPrice = () => {
    if (formData.plan === "custom") return formData.monthlyAmount;
    if (formData.plan === "advertising") {
      const channels = formData.selectedServices.filter(s => s.startsWith("channel-")).length;
      return getAdvertisingPrice(channels);
    }
    if (formData.plan === "amazon") return 999;
    return planConfigs[formData.plan]?.amount || 0;
  };

  const handleSubmit = async () => {
    if (!client) return;
    if (!formData.clientName.trim()) { toast.error("Client name is required"); return; }
    if (!formData.email.trim()) { toast.error("Email is required"); return; }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const finalNotes = formData.plan === "custom" && additionalEmails.trim()
        ? `[Additional Emails: ${additionalEmails.trim()}]\n${formData.notes}`
        : formData.notes;

      // Handle contract & proposal file uploads if new files were selected
      let contractDetails: any = {
        ...((client as any)?.contractDetails || {}),
        ...contractTerms,
      };

      if (contractFile) {
        toast.info("Uploading contract document...");
        const fileExt = contractFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(fileName, contractFile);

        if (uploadError) {
          throw new Error(`Failed to upload contract file: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("contracts")
          .getPublicUrl(fileName);

        contractDetails.uploadedContractUrl = urlData?.publicUrl || null;
        contractDetails.uploadedContractName = contractFile.name;
      }

      if (proposalFile) {
        toast.info("Uploading proposal document...");
        const fileExt = proposalFile.name.split(".").pop();
        const fileName = `${Date.now()}_proposal_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(fileName, proposalFile);

        if (uploadError) {
          throw new Error(`Failed to upload proposal file: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("contracts")
          .getPublicUrl(fileName);

        contractDetails.uploadedProposalUrl = urlData?.publicUrl || null;
        contractDetails.uploadedProposalName = proposalFile.name;
      }

      const response = await supabase.functions.invoke("update-client", {
        body: { 
          clientId: client.id, 
          ...formData, 
          maxServices: formData.plan === "custom" ? (parseInt(formData.maxServices as any) || 1) : planConfigs[formData.plan].maxServices,
          notes: finalNotes,
          ...(contractDetails !== undefined ? { contractDetails } : {}),
          subscriptions: clientSubscriptions.length > 0 ? clientSubscriptions : undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      toast.success("Client updated successfully");
      onClientUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast.error(error.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const isAutomationPlan = ["single", "triple", "full"].includes(formData.plan);
  const isAdvertisingPlan = formData.plan === "advertising";
  const isAmazonPlan = formData.plan === "amazon";
  const isCustomPlan = formData.plan === "custom";
  const selectedChannelCount = formData.selectedServices.filter(s => s.startsWith("channel-")).length;
  const generalServicesCount = formData.selectedServices.filter(s => !s.startsWith("channel-")).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card text-foreground border-border shadow-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>Edit Client:</span>
                <span className="text-primary">{formData.clientName || formData.email || "Client"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Manage services, contract terms, documents, and recurring subscription lines
              </DialogDescription>
            </div>
            {formData.plan && (
              <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-primary border-primary/30 bg-primary/10">
                {formData.plan} Plan
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-3">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/60 p-1 border border-border/60 rounded-lg">
            <TabsTrigger
              value="services"
              className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Services & Deliverables</span>
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-muted text-foreground">
                {formData.selectedServices.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Agreement</span>
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="flex items-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Subscriptions & Billing</span>
              {clientSubscriptions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-muted text-foreground">
                  {clientSubscriptions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SERVICES & DELIVERABLES */}
          <TabsContent value="services" className="space-y-4 focus-visible:outline-none">
            {/* Plan selection & limits summary */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Assigned Package Type *</Label>
                  <Select value={formData.plan} onValueChange={handlePlanChange}>
                    <SelectTrigger className="bg-background text-foreground border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Service ($888/mo)</SelectItem>
                      <SelectItem value="triple">Triple Bundle ($2,664/mo)</SelectItem>
                      <SelectItem value="full">Full Suite ($3,996/mo)</SelectItem>
                      <SelectItem value="amazon">Amazon Design ($999 one-time)</SelectItem>
                      <SelectItem value="advertising">Advertising Package</SelectItem>
                      <SelectItem value="custom">Custom Plan</SelectItem>
                      <SelectItem value="prospect">Prospect (Discovery Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="p-2.5 rounded-lg border border-border/60 bg-background flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Service Allocation</p>
                      <p className="text-sm font-bold text-foreground">
                        {formData.selectedServices.length} Selected
                        {formData.plan !== "custom" && ` / ${formData.maxServices} Max`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Price</p>
                      <p className="text-sm font-bold text-primary font-mono">
                        ${getDisplayPrice().toLocaleString()}{isAmazonPlan ? " (one-time)" : "/mo"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Plan Options */}
              {isCustomPlan && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/60">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-monthlyAmount" className="text-xs font-semibold text-foreground">Monthly Amount ($) *</Label>
                    <Input
                      id="edit-monthlyAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthlyAmount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, monthlyAmount: parseFloat(e.target.value) || 0 }))}
                      className="bg-background text-foreground border-input font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-maxServices" className="text-xs font-semibold text-foreground">Max Services Cap *</Label>
                    <Input
                      id="edit-maxServices"
                      type="number"
                      min="1"
                      value={formData.maxServices}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setFormData((prev) => ({ ...prev, maxServices: "" as any }));
                          return;
                        }
                        const value = parseInt(val);
                        if (!isNaN(value)) {
                          setFormData((prev) => ({
                            ...prev,
                            maxServices: value,
                            selectedServices: prev.selectedServices.slice(0, value),
                          }));
                        }
                      }}
                      className="bg-background text-foreground border-input font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Amazon Design Banner */}
            {isAmazonPlan && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-1">
                <p className="text-sm font-bold text-foreground">Amazon Design Package</p>
                <p className="text-xs text-muted-foreground">$999 one-time fee • Complete listing design, branding, and conversion optimization</p>
              </div>
            )}

            {/* Automation Services */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Automation & Growth Systems
                </Label>
                <span className="text-xs text-muted-foreground">
                  {generalServicesCount} selected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {automationServices.filter(s => s.id !== "advertising-package").map((service) => {
                  const isSelected = formData.selectedServices.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30"
                      }`}
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                          className="data-[state=checked]:bg-primary"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">{service.label}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">${service.price}/mo</p>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] h-5">
                          Active
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advertising Channels */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Advertising & Paid Media Channels ({selectedChannelCount}/8)
                </Label>
                {selectedChannelCount >= 3 && (
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5">
                    Bundle Pricing Active
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {advertisingChannels.map((channel) => {
                  const isSelected = formData.selectedServices.includes(channel.id);
                  return (
                    <div
                      key={channel.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30"
                      }`}
                      onClick={() => handleServiceToggle(channel.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleServiceToggle(channel.id)}
                        className="data-[state=checked]:bg-primary shrink-0"
                      />
                      <span className="text-xs font-medium text-foreground truncate">{channel.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Bespoke Services */}
            <div className="pt-3 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Custom Bespoke Services {customServices.length > 0 ? `(${customServices.length})` : ""}</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add custom client-specific deliverables, technical integrations, or advisory retainers
                  </p>
                </div>
                {!showAddCustom && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCustom(true)}
                    className="h-7 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Service</span>
                  </Button>
                )}
              </div>

              {showAddCustom && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
                  <Input
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    placeholder="e.g. B2B Wholesale Portal, Cold Outreach Pipeline..."
                    className="h-8 text-xs bg-background text-foreground border-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomService();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomService}
                    disabled={!customServiceName.trim()}
                    className="h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomServiceName("");
                      setShowAddCustom(false);
                    }}
                    className="h-8 text-xs px-2 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {customServices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {customServices.map((service) => {
                    const isSelected = formData.selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/80 bg-card hover:border-primary/50"
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2"
                          onClick={() => handleServiceToggle(service.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                            className="data-[state=checked]:bg-primary"
                          />
                          <span className="text-xs font-bold text-foreground truncate" title={service.label}>
                            {service.label}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 bg-primary/10 font-medium shrink-0">
                            Custom
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomService(service.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          title="Remove custom service"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: PROFILE & AGREEMENT */}
          <TabsContent value="profile" className="space-y-4 focus-visible:outline-none">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-clientName" className="text-xs font-semibold text-foreground">Client Name *</Label>
                <Input
                  id="edit-clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                  placeholder="John Doe"
                  className="bg-background text-foreground border-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-semibold text-foreground">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="bg-background text-foreground border-input"
                />
              </div>
            </div>

            {/* Active & Contract Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Client Account Status</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, isActive: v === "active" }))}
                >
                  <SelectTrigger className="bg-background text-foreground border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Access Enabled)</SelectItem>
                    <SelectItem value="inactive">Inactive (Access Suspended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Master Contract Status</Label>
                <Select
                  value={formData.contractStatus}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, contractStatus: v }))}
                >
                  <SelectTrigger className="bg-background text-foreground border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_signed">Awaiting Signature</SelectItem>
                    <SelectItem value="signed">Fully Executed & Signed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Documents Section */}
            <div className="p-4 bg-muted/30 border border-border/80 rounded-xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contractFile" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Upload / Replace Contract Document (Optional)</span>
                </Label>
                {existingContractName && !contractFile && (
                  <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border border-border/60">
                    Current: <span className="text-foreground font-semibold">{existingContractName}</span>
                  </p>
                )}
                <Input
                  id="edit-contractFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                  className="bg-background cursor-pointer text-foreground file:text-foreground border-input"
                />
                <p className="text-[11px] text-muted-foreground">
                  Upload PDF or Word document representing the master client service agreement.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/60">
                <Label htmlFor="edit-proposalFile" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Upload / Replace Proposal Document (Optional)</span>
                </Label>
                {existingProposalName && !proposalFile && (
                  <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border border-border/60">
                    Current: <span className="text-foreground font-semibold">{existingProposalName}</span>
                  </p>
                )}
                <Input
                  id="edit-proposalFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
                  className="bg-background cursor-pointer text-foreground file:text-foreground border-input"
                />
                <p className="text-[11px] text-muted-foreground">
                  Upload proposal deck or scope documentation for client review alongside agreement.
                </p>
              </div>
            </div>

            {/* Contract Terms */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contract Terms & Governance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-initialTerm" className="text-xs font-semibold text-foreground">Initial Term</Label>
                  <Input
                    id="edit-initialTerm"
                    value={contractTerms.initialTerm}
                    onChange={(e) => setContractTerms((prev) => ({ ...prev, initialTerm: e.target.value }))}
                    placeholder="e.g., 6 months"
                    className="bg-background text-foreground border-input text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-noticePeriod" className="text-xs font-semibold text-foreground">Notice Period</Label>
                  <Input
                    id="edit-noticePeriod"
                    value={contractTerms.noticePeriod}
                    onChange={(e) => setContractTerms((prev) => ({ ...prev, noticePeriod: e.target.value }))}
                    placeholder="e.g., 30 days"
                    className="bg-background text-foreground border-input text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-billingTerms" className="text-xs font-semibold text-foreground">Billing and Due Date Terms</Label>
                <Input
                  id="edit-billingTerms"
                  value={contractTerms.billingTerms}
                  onChange={(e) => setContractTerms((prev) => ({ ...prev, billingTerms: e.target.value }))}
                  placeholder="e.g., Initial payment due upon full execution..."
                  className="bg-background text-foreground border-input text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-serviceDelivery" className="text-xs font-semibold text-foreground">Service Delivery Location / Scope</Label>
                <Input
                  id="edit-serviceDelivery"
                  value={contractTerms.serviceDelivery}
                  onChange={(e) => setContractTerms((prev) => ({ ...prev, serviceDelivery: e.target.value }))}
                  placeholder="e.g., Remote unless otherwise agreed in writing"
                  className="bg-background text-foreground border-input text-xs"
                />
              </div>
            </div>

            {/* Additional Emails */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-additionalEmails" className="text-xs font-semibold text-foreground">Additional Notification Emails (Optional)</Label>
              <Input
                id="edit-additionalEmails"
                value={additionalEmails}
                onChange={(e) => setAdditionalEmails(e.target.value)}
                placeholder="billing@company.com, ops@company.com"
                className="bg-background text-foreground border-input text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Comma-separated email addresses to receive invoices and operational notices.</p>
            </div>
          </TabsContent>

          {/* TAB 3: SUBSCRIPTIONS & BILLING */}
          <TabsContent value="billing" className="space-y-4 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-muted/30">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Primary Subscription Status</Label>
                <Select
                  value={formData.subscriptionStatus}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, subscriptionStatus: v }))}
                >
                  <SelectTrigger className="bg-background text-foreground border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Primary Monthly Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.monthlyAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, monthlyAmount: parseFloat(e.target.value) || 0 }))}
                  className="bg-background text-foreground border-input font-mono"
                />
              </div>
            </div>

            {/* Multi-Subscriptions Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Subscription Lines (Multi-Billing Channels)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Manage discrete retainer commitments, billing days, and linked Stripe subscriptions
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClientSubscriptions((prev) => [
                    ...prev,
                    {
                      label: "",
                      plan: "custom",
                      monthlyAmount: 0,
                      billingDay: null,
                      subscriptionStatus: "pending_payment",
                      isPrimary: prev.length === 0,
                      selectedServices: [],
                      stripeSubscriptionId: "",
                      stripeCustomerId: "",
                      notes: "",
                      contractStatus: "not_signed",
                      contractDetails: null,
                    },
                  ])}
                  className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </Button>
              </div>

              {clientSubscriptions.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border/80 text-center bg-muted/20">
                  <p className="text-xs text-muted-foreground italic">
                    No discrete subscription lines configured. Client billing follows the master package above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientSubscriptions.map((sub, idx) => (
                    <div
                      key={sub.id || `new-${idx}`}
                      className={`border rounded-xl p-4 space-y-3 transition-colors ${
                        sub.isPrimary ? "border-primary/50 bg-primary/5" : "border-border/80 bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">Line #{idx + 1}</span>
                          {sub.isPrimary && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] h-4">
                              Primary Retainer
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            <input
                              type="radio"
                              name="primarySub"
                              checked={sub.isPrimary}
                              onChange={() => setClientSubscriptions((prev) =>
                                prev.map((s, i) => ({ ...s, isPrimary: i === idx }))
                              )}
                              className="accent-primary"
                            />
                            <span>Make Primary</span>
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setClientSubscriptions((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-1 md:col-span-2">
                          <Label className="text-[11px] font-semibold text-foreground">Line Label / Description</Label>
                          <Input
                            value={sub.label}
                            onChange={(e) => setClientSubscriptions((prev) =>
                              prev.map((s, i) => i === idx ? { ...s, label: e.target.value } : s)
                            )}
                            placeholder="e.g. PPC + Social Automation Retainer"
                            className="h-8 text-xs bg-background text-foreground border-input"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-foreground">Monthly Amount ($)</Label>
                          <Input
                            type="number"
                            value={sub.monthlyAmount}
                            onChange={(e) => setClientSubscriptions((prev) =>
                              prev.map((s, i) => i === idx ? { ...s, monthlyAmount: parseFloat(e.target.value) || 0 } : s)
                            )}
                            className="h-8 text-xs bg-background text-foreground border-input font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-muted-foreground" />
                            <span>Billing Day (1-31)</span>
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            value={sub.billingDay ?? ""}
                            onChange={(e) => setClientSubscriptions((prev) =>
                              prev.map((s, i) => i === idx ? { ...s, billingDay: e.target.value ? parseInt(e.target.value) : null } : s)
                            )}
                            placeholder="e.g. 15"
                            className="h-8 text-xs bg-background text-foreground border-input font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-foreground">Line Status</Label>
                          <Select
                            value={sub.subscriptionStatus}
                            onValueChange={(v) => setClientSubscriptions((prev) =>
                              prev.map((s, i) => i === idx ? { ...s, subscriptionStatus: v } : s)
                            )}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background text-foreground border-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending_payment">Pending</SelectItem>
                              <SelectItem value="past_due">Past Due</SelectItem>
                              <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-foreground">Stripe Subscription ID</Label>
                          <Input
                            value={sub.stripeSubscriptionId}
                            onChange={(e) => setClientSubscriptions((prev) =>
                              prev.map((s, i) => i === idx ? { ...s, stripeSubscriptionId: e.target.value } : s)
                            )}
                            placeholder="sub_..."
                            className="h-8 text-xs font-mono bg-background text-foreground border-input"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-1 md:col-span-2">
                          <Label className="text-[11px] font-semibold text-foreground">Deliverables Assigned to Line</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {[...automationServices, ...advertisingChannels, ...customServices].map((svc) => {
                              const isChecked = (sub.selectedServices || []).includes(svc.id);
                              return (
                                <Badge
                                  key={svc.id}
                                  variant={isChecked ? "default" : "outline"}
                                  className={`text-[10px] cursor-pointer transition-all ${
                                    isChecked
                                      ? "bg-primary text-primary-foreground font-semibold"
                                      : "border-border/80 text-muted-foreground hover:border-primary/50"
                                  }`}
                                  onClick={() => setClientSubscriptions((prev) =>
                                    prev.map((s, i) => i === idx ? {
                                      ...s,
                                      selectedServices: isChecked
                                        ? s.selectedServices.filter((id) => id !== svc.id)
                                        : [...s.selectedServices, svc.id],
                                    } : s)
                                  )}
                                >
                                  {isChecked ? "✓ " : ""}{svc.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="edit-notes" className="text-xs font-semibold text-foreground">Internal Operational Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal billing preferences, banking details, or client-specific agreement terms..."
                rows={3}
                className="bg-background text-foreground border-input text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-border/80 pt-4 mt-6 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{formData.selectedServices.length} Services Selected</span>
            <span>•</span>
            <span className="font-mono text-foreground font-semibold">
              ${getDisplayPrice().toLocaleString()}{isAmazonPlan ? "" : "/mo"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="text-foreground">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground font-semibold">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
