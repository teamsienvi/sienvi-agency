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
import { Loader2 } from "lucide-react";

const automationServices = [
  { id: "social-media-suite", label: "Social Media Suite", price: 2450 },
  { id: "ecommerce-operations", label: "E-Commerce Operations", price: 888 },
  { id: "custom-website", label: "Custom Website Development", price: 888 },
  { id: "seo-aeo", label: "SEO/AEO Package", price: 888 },
  { id: "custom-lms", label: "Custom LMS Package", price: 2450 },
  { id: "custom-gpt", label: "Custom GPT Product", price: 888 },
  { id: "custom-tool", label: "Custom Tool", price: 888 },
  { id: "custom-ai-assistant", label: "Custom AI Assistant", price: 888 },
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
  });

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
      });

      // Load existing contract name if available
      setExistingContractName((client as any).contractDetails?.uploadedContractName || null);
      setContractFile(null);
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
      if (formData.plan === "custom" && contractFile) {
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
          uploadedContractUrl: urlData?.publicUrl || null,
          uploadedContractName: contractFile.name,
        };
      }

      const response = await supabase.functions.invoke("update-client", {
        body: { 
          clientId: client.id, 
          ...formData, 
          maxServices: formData.plan === "custom" ? (parseInt(formData.maxServices as any) || 1) : planConfigs[formData.plan].maxServices,
          notes: finalNotes,
          ...(contractDetails !== undefined ? { contractDetails } : {}),
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Active Status */}
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
              <div className="space-y-2">
                <Label htmlFor="edit-contractFile">Upload Custom Contract (Optional)</Label>
                {existingContractName && !contractFile && (
                  <p className="text-xs text-muted-foreground">Current: {existingContractName}</p>
                )}
                <Input
                  id="edit-contractFile"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground italic">
                  Upload a new PDF to replace the current contract. Leave empty to keep the existing one.
                </p>
              </div>
            </div>
          )}

          {/* Amazon Design Info */}
          {isAmazonPlan && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Amazon Design Package</p>
              <p className="text-sm text-muted-foreground">$999 one-time fee — Professional listing design and optimization</p>
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
