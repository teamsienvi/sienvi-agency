import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Trash2, CalendarDays } from "lucide-react";
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
}

export const EditClientModal = ({
  open,
  onOpenChange,
  client,
  onClientUpdated,
}: EditClientModalProps) => {
  const [loading, setLoading] = useState(false);
  const [additionalEmails, setAdditionalEmails] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [existingContractName, setExistingContractName] = useState<string | null>(null);
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
      setContractTerms({
        initialTerm: cd.initialTerm || "6 months",
        noticePeriod: cd.noticePeriod || "30 days",
        billingTerms: cd.billingTerms || "Initial payment due upon full execution; recurring invoices monthly from Effective Date",
        serviceDelivery: cd.serviceDelivery || "Remote unless otherwise agreed in writing",
      });
      setContractFile(null);

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

      // Handle contract file upload if a new file was selected
      let contractDetails: any = undefined; // undefined = don't update
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

        contractDetails = {
          ...((client as any)?.contractDetails || {}),
          uploadedContractUrl: urlData?.publicUrl || null,
          uploadedContractName: contractFile.name,
          ...contractTerms,
        };
      } else {
        // Even without a new file upload, always send contract terms
        contractDetails = {
          ...((client as any)?.contractDetails || {}),
          ...contractTerms,
        };
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-slate-900">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-clientName">Client Name *</Label>
              <Input
                id="edit-clientName"
                value={formData.clientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Package Type *</Label>
              <Select value={formData.plan} onValueChange={handlePlanChange}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Subscription Status</Label>
              <Select
                value={formData.subscriptionStatus}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, subscriptionStatus: v }))}
              >
                <SelectTrigger>
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
          </div>

          {/* Active & Contract Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Active Status</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, isActive: v === "active" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contract Status</Label>
              <Select
                value={formData.contractStatus}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, contractStatus: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_signed">Awaiting Signature</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2 mt-2">
              <Label htmlFor="edit-contractFile" className="font-semibold text-sm">Upload/Replace Contract Document (Optional)</Label>
              {existingContractName && !contractFile && (
                <p className="text-xs text-muted-foreground">Current: {existingContractName}</p>
              )}
              <Input
                id="edit-contractFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  setContractFile(e.target.files?.[0] || null);
                }}
                className="bg-background cursor-pointer text-foreground file:text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a contract document (PDF or Word). This can be a signed copy or a template for the client to review and sign.
              </p>
            </div>
            {/* Contract Terms */}
            <div className="col-span-2 space-y-3 mt-2 p-4 bg-muted/50 rounded-lg border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contract Terms</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-initialTerm">Initial Term</Label>
                  <Input
                    id="edit-initialTerm"
                    value={contractTerms.initialTerm}
                    onChange={(e) => setContractTerms((prev) => ({ ...prev, initialTerm: e.target.value }))}
                    placeholder="e.g., 6 months"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-noticePeriod">Notice Period</Label>
                  <Input
                    id="edit-noticePeriod"
                    value={contractTerms.noticePeriod}
                    onChange={(e) => setContractTerms((prev) => ({ ...prev, noticePeriod: e.target.value }))}
                    placeholder="e.g., 30 days"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-billingTerms">Billing and Due Date</Label>
                <Input
                  id="edit-billingTerms"
                  value={contractTerms.billingTerms}
                  onChange={(e) => setContractTerms((prev) => ({ ...prev, billingTerms: e.target.value }))}
                  placeholder="e.g., Initial payment due upon full execution..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-serviceDelivery">Service Delivery</Label>
                <Input
                  id="edit-serviceDelivery"
                  value={contractTerms.serviceDelivery}
                  onChange={(e) => setContractTerms((prev) => ({ ...prev, serviceDelivery: e.target.value }))}
                  placeholder="e.g., Remote unless otherwise agreed in writing"
                />
              </div>
            </div>
          </div>

          {/* Custom Plan Options */}
          {isCustomPlan && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-monthlyAmount">Monthly Amount ($) *</Label>
                  <Input
                    id="edit-monthlyAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthlyAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, monthlyAmount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxServices">Max Services *</Label>
                  <Input
                    id="edit-maxServices"
                    type="number"
                    min="1"
                    value={formData.maxServices}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setFormData((prev) => ({
                          ...prev,
                          maxServices: "" as any,
                        }));
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
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-additionalEmails">Additional Emails (comma separated)</Label>
                <Input
                  id="edit-additionalEmails"
                  value={additionalEmails}
                  onChange={(e) => setAdditionalEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>
          )}

          {/* Amazon Design Info */}
          {isAmazonPlan && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Amazon Design Package</p>
              <p className="text-sm text-muted-foreground">$999 one-time fee - Professional listing design and optimization</p>
            </div>
          )}

          {/* Advertising Channel Selection */}
          {isAdvertisingPlan && (
            <div className="space-y-3">
              <Label>
                Advertising Channels ({selectedChannelCount}/7)
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  Est. ${getAdvertisingPrice(selectedChannelCount).toLocaleString()}/mo
                  {selectedChannelCount >= 3 && " (bundle pricing)"}
                </span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {advertisingChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.selectedServices.includes(channel.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleServiceToggle(channel.id)}
                  >
                    <Checkbox
                      checked={formData.selectedServices.includes(channel.id)}
                      onCheckedChange={() => handleServiceToggle(channel.id)}
                    />
                    <span className="text-sm font-medium">{channel.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation Service Selection */}
          {(isAutomationPlan || isCustomPlan) && (
            <div className="space-y-3">
              <Label>
                {formData.plan === "custom" ? "Selected Services" : `Selected Services (${formData.selectedServices.length}/${formData.maxServices})`}
              </Label>
              {isCustomPlan ? (
                <div className="space-y-4 w-full">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Services ({generalServicesCount}/{formData.maxServices})</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {automationServices.filter(s => s.id !== "advertising-package").map((service) => (
                        <div
                          key={service.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.selectedServices.includes(service.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleServiceToggle(service.id)}
                        >
                          <Checkbox
                            checked={formData.selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                          />
                          <div>
                            <span className="text-sm font-medium">{service.label}</span>
                            <span className="text-xs text-muted-foreground ml-1">(${service.price}/mo)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advertising Specific</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {advertisingChannels.map((channel) => (
                        <div
                          key={channel.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.selectedServices.includes(channel.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleServiceToggle(channel.id)}
                        >
                          <Checkbox
                            checked={formData.selectedServices.includes(channel.id)}
                            onCheckedChange={() => handleServiceToggle(channel.id)}
                          />
                          <div>
                            <span className="text-sm font-medium">{channel.label}</span>
                            <span className="text-xs text-muted-foreground ml-1">($999/mo)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {automationServices.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.selectedServices.includes(service.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <Checkbox
                        checked={formData.selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <div>
                        <span className="text-sm font-medium">{service.label}</span>
                        <span className="text-xs text-muted-foreground ml-1">(${service.price}/mo)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Multi-Subscriptions Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Subscriptions (Multi-Billing)</Label>
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
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Subscription
              </Button>
            </div>
            {clientSubscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No separate subscriptions configured. The main plan fields above are used.</p>
            ) : (
              <div className="space-y-4">
                {clientSubscriptions.map((sub, idx) => (
                  <div key={sub.id || `new-${idx}`} className={`border rounded-lg p-4 space-y-3 ${
                    sub.isPrimary ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-muted-foreground">Subscription #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="primarySub"
                            checked={sub.isPrimary}
                            onChange={() => setClientSubscriptions((prev) =>
                              prev.map((s, i) => ({ ...s, isPrimary: i === idx }))
                            )}
                            className="accent-primary"
                          />
                          Primary
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setClientSubscriptions((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Label / Name</Label>
                        <Input
                          value={sub.label}
                          onChange={(e) => setClientSubscriptions((prev) =>
                            prev.map((s, i) => i === idx ? { ...s, label: e.target.value } : s)
                          )}
                          placeholder="e.g. PPC + Social Automation Package"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Monthly Amount ($)</Label>
                        <Input
                          type="number"
                          value={sub.monthlyAmount}
                          onChange={(e) => setClientSubscriptions((prev) =>
                            prev.map((s, i) => i === idx ? { ...s, monthlyAmount: parseFloat(e.target.value) || 0 } : s)
                          )}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Billing Day (1-31)
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
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={sub.subscriptionStatus}
                          onValueChange={(v) => setClientSubscriptions((prev) =>
                            prev.map((s, i) => i === idx ? { ...s, subscriptionStatus: v } : s)
                          )}
                        >
                          <SelectTrigger className="h-8 text-sm">
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
                        <Label className="text-xs">Stripe Subscription ID</Label>
                        <Input
                          value={sub.stripeSubscriptionId}
                          onChange={(e) => setClientSubscriptions((prev) =>
                            prev.map((s, i) => i === idx ? { ...s, stripeSubscriptionId: e.target.value } : s)
                          )}
                          placeholder="sub_..."
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Contract Status</Label>
                        <Select
                          value={sub.contractStatus}
                          onValueChange={(v) => setClientSubscriptions((prev) =>
                            prev.map((s, i) => i === idx ? { ...s, contractStatus: v } : s)
                          )}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_signed">Not Signed</SelectItem>
                            <SelectItem value="signed">Signed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {sub.contractDetails?.uploadedContractName && (
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs text-muted-foreground">Contract Document</Label>
                          <p className="text-xs truncate">{sub.contractDetails.uploadedContractName}</p>
                        </div>
                      )}
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">Services for this subscription</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[...automationServices, ...advertisingChannels].map((svc) => {
                            const isChecked = (sub.selectedServices || []).includes(svc.id);
                            return (
                              <Badge
                                key={svc.id}
                                variant={isChecked ? "default" : "outline"}
                                className={`text-[10px] cursor-pointer transition-colors ${isChecked ? "" : "opacity-50 hover:opacity-100"}`}
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

          <Separator />

          {/* Price Summary */}
          <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
            <span className="font-medium">Estimated Price</span>
            <span className="text-lg font-bold">
              ${getDisplayPrice().toLocaleString()}{isAmazonPlan ? " (one-time)" : "/mo"}
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Internal Notes (Optional)</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this client..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
