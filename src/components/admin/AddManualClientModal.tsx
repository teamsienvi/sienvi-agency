import { useState } from "react";
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
import { ClientCreatedActions } from "./ClientCreatedActions";

const automationServices = [
  { id: "social-media-suite", label: "Social Media Suite" },
  { id: "ecommerce-operations", label: "E-Commerce Operations" },
  { id: "custom-website", label: "Custom Website Development" },
  { id: "seo-aeo", label: "SEO/AEO Package" },
  { id: "custom-lms", label: "Custom LMS Package" },
  { id: "custom-gpt", label: "Custom GPT Product" },
  { id: "custom-tool", label: "Custom Tool" },
  { id: "advertising-package", label: "Advertising" },
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
  triple: { amount: 2398.20, maxServices: 3 },
  full: { amount: 3996, maxServices: 6 },
  amazon: { amount: 999, maxServices: 1 },
  advertising: { amount: 999, maxServices: 7 },
  custom: { amount: 0, maxServices: 6 },
};

interface CreatedClient {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  plan: string;
  subscriptionStatus: string;
}

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

export const AddManualClientModal = ({
  open,
  onOpenChange,
  onClientAdded,
}: AddClientModalProps) => {
  const [loading, setLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState<CreatedClient | null>(null);
  const [additionalEmails, setAdditionalEmails] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    clientType: "new" as "new" | "existing",
    plan: "single" as "single" | "triple" | "full" | "amazon" | "advertising" | "custom",
    customPrice: 888,
    maxServices: 1,
    selectedServices: [] as string[],
    subscriptionStatus: "pending_payment" as "pending_payment" | "active" | "past_due" | "canceled",
    contractStatus: "not_signed" as "not_signed" | "signed",
    onboardingStatus: "not_started" as "not_started" | "in_progress" | "completed",
    notes: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setContractFile(e.target.files[0]);
    } else {
      setContractFile(null);
    }
  };

  const handlePlanChange = (plan: string) => {
    const planConfig = planConfigs[plan] || planConfigs.single;
    setFormData((prev) => ({
      ...prev,
      plan: plan as typeof prev.plan,
      customPrice: plan === "custom" ? prev.customPrice : planConfig.amount,
      maxServices: plan === "custom" ? prev.maxServices : planConfig.maxServices,
      selectedServices: plan === "amazon" ? ["amazon-design"] : prev.selectedServices.slice(0, plan === "custom" ? prev.maxServices : planConfig.maxServices),
    }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedServices.includes(serviceId);
      if (isSelected) {
        return {
          ...prev,
          selectedServices: prev.selectedServices.filter((s) => s !== serviceId),
        };
      } else {
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
        return {
          ...prev,
          selectedServices: [...prev.selectedServices, serviceId],
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      let uploadedContractUrl = null;
      let uploadedContractName = null;

      if (formData.plan === "custom" && contractFile) {
        toast.info("Uploading contract document...");
        const fileExt = contractFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(filePath, contractFile);

        if (uploadError) {
          throw new Error(`Failed to upload contract file: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("contracts")
          .getPublicUrl(filePath);

        uploadedContractUrl = urlData?.publicUrl || null;
        uploadedContractName = contractFile.name;
      }

      const finalNotes = formData.plan === "custom" && additionalEmails.trim()
        ? `[Additional Emails: ${additionalEmails.trim()}]\n${formData.notes}`
        : formData.notes;

      const contractDetails = uploadedContractUrl 
        ? { uploadedContractUrl, uploadedContractName }
        : null;

      const response = await supabase.functions.invoke("create-client", {
        body: {
          ...formData,
          maxServices: formData.plan === "custom" ? (parseInt(formData.maxServices as any) || 1) : planConfigs[formData.plan].maxServices,
          notes: finalNotes,
          contractDetails,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      toast.success("Client created successfully");
      
      // Show post-creation actions instead of closing immediately
      setCreatedClient({
        id: response.data.client.id,
        email: response.data.client.email,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        plan: formData.plan,
        subscriptionStatus: formData.subscriptionStatus,
        customPrice: formData.plan === "custom" ? formData.customPrice : null,
        maxServices: formData.plan === "custom" ? formData.maxServices : null,
      });
      
      onClientAdded();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create client";
      console.error("Error creating client:", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setCreatedClient(null);
    onOpenChange(false);
    setAdditionalEmails("");
    // Reset form
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      clientType: "new",
      plan: "single",
      customPrice: 888,
      maxServices: 1,
      selectedServices: [],
      subscriptionStatus: "pending_payment",
      contractStatus: "not_signed",
      onboardingStatus: "not_started",
      notes: "",
    });
  };

  const maxAllowed = formData.plan === "custom" 
    ? (parseInt(formData.maxServices as any) || 0) 
    : planConfigs[formData.plan].maxServices;
  const generalServicesCount = formData.selectedServices.filter(s => !s.startsWith("channel-")).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleDone();
      else onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {createdClient ? (
          <ClientCreatedActions client={createdClient} onDone={handleDone} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section A: Client Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Client Identity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Client Type</Label>
                <Select
                  value={formData.clientType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, clientType: v as "new" | "existing" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Client</SelectItem>
                    <SelectItem value="existing">Existing Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Section B: Plan & Billing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Plan & Billing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan *</Label>
                <Select value={formData.plan} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Service ($888/mo)</SelectItem>
                    <SelectItem value="triple">Triple Automation ($2,398.20/mo)</SelectItem>
                    <SelectItem value="full">Full Automation ($3,996/mo)</SelectItem>
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
                  onValueChange={(v) => setFormData((prev) => ({ 
                    ...prev, 
                    subscriptionStatus: v as typeof prev.subscriptionStatus 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="active">Active (Existing Client)</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Plan Options */}
            {formData.plan === "custom" && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customPrice">Monthly Amount ($) *</Label>
                    <Input
                      id="customPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.customPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customPrice: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxServices">Max Services *</Label>
                    <Input
                      id="maxServices"
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
                            maxServices: Math.max(1, value),
                            selectedServices: prev.selectedServices.slice(0, Math.max(1, value)),
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalEmails">Additional Emails (comma separated)</Label>
                  <Input
                    id="additionalEmails"
                    value={additionalEmails}
                    onChange={(e) => setAdditionalEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
                <div className="space-y-2 border-t pt-4 mt-4">
                  <Label htmlFor="contractFile" className="font-semibold text-sm">Upload Custom Contract (Optional)</Label>
                  <Input
                    id="contractFile"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="bg-background cursor-pointer text-foreground file:text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Note for Admins:</strong> This is for custom plans only. If you upload a custom PDF/DOCX contract, it will be presented to the client during onboarding instead of the standard template.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section C: Contract & Onboarding Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Lifecycle Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Status</Label>
                <Select
                  value={formData.contractStatus}
                  onValueChange={(v) => setFormData((prev) => ({ 
                    ...prev, 
                    contractStatus: v as typeof prev.contractStatus 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_signed">Not Signed</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Onboarding Status</Label>
                <Select
                  value={formData.onboardingStatus}
                  onValueChange={(v) => setFormData((prev) => ({ 
                    ...prev, 
                    onboardingStatus: v as typeof prev.onboardingStatus 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-3">
            <Label>
              {formData.plan === "amazon" 
                ? "Selected Package" 
                : formData.plan === "custom"
                  ? "Selected Services"
                  : `Selected Services (${formData.selectedServices.length}/${maxAllowed})`}
            </Label>
            {formData.plan === "amazon" ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">Amazon Design Package</p>
                <p className="text-sm text-muted-foreground">$999 one-time fee — Professional listing design and optimization</p>
              </div>
            ) : formData.plan === "custom" ? (
              <div className="space-y-4 w-full">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Services ({generalServicesCount}/{maxAllowed})</h4>
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
                        <span className="text-sm font-medium">{service.label}</span>
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
                        <span className="text-sm font-medium">{channel.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {formData.plan === "advertising" ? (
                  advertisingChannels.map((channel) => (
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
                  ))
                ) : (
                  automationServices.map((service) => (
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
                      <span className="text-sm font-medium">{service.label}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this client..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDone} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Client
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};