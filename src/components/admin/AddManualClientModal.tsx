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

const services = [
  { id: "social-media-suite", label: "Social Media Suite" },
  { id: "ecommerce-operations", label: "E-Commerce Operations" },
  { id: "custom-website", label: "Custom Website Development" },
  { id: "seo-aeo", label: "SEO/AEO Package" },
  { id: "custom-lms", label: "Custom LMS Package" },
  { id: "custom-gpt", label: "Custom GPT Product" },
];

const planLimits: Record<string, number> = {
  single: 1,
  triple: 3,
  full: 6,
  custom: 6,
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
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    clientType: "new" as "new" | "existing",
    plan: "single" as "single" | "triple" | "full" | "custom",
    customPrice: 888,
    maxServices: 1,
    selectedServices: [] as string[],
    subscriptionStatus: "pending_payment" as "pending_payment" | "active" | "past_due" | "canceled",
    contractStatus: "not_signed" as "not_signed" | "signed",
    onboardingStatus: "not_started" as "not_started" | "in_progress" | "completed",
    notes: "",
  });

  const handlePlanChange = (plan: string) => {
    const limits: Record<string, { amount: number; services: number }> = {
      single: { amount: 888, services: 1 },
      triple: { amount: 2398.20, services: 3 },
      full: { amount: 3996, services: 6 },
      custom: { amount: formData.customPrice, services: formData.maxServices },
    };

    const planConfig = limits[plan] || limits.single;
    setFormData((prev) => ({
      ...prev,
      plan: plan as typeof prev.plan,
      customPrice: planConfig.amount,
      maxServices: planConfig.services,
      selectedServices: prev.selectedServices.slice(0, planConfig.services),
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
        const maxAllowed = prev.plan === "custom" ? prev.maxServices : planLimits[prev.plan];
        if (prev.selectedServices.length >= maxAllowed) {
          toast.error(`Maximum ${maxAllowed} services allowed for this plan`);
          return prev;
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

      const response = await supabase.functions.invoke("create-client", {
        body: formData,
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

  const maxAllowed = formData.plan === "custom" ? formData.maxServices : planLimits[formData.plan];

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
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
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
                  <Label htmlFor="maxServices">Max Services (1-6) *</Label>
                  <Input
                    id="maxServices"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.maxServices}
                    onChange={(e) => {
                      const value = Math.min(6, Math.max(1, parseInt(e.target.value) || 1));
                      setFormData((prev) => ({
                        ...prev,
                        maxServices: value,
                        selectedServices: prev.selectedServices.slice(0, value),
                      }));
                    }}
                  />
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
              Selected Services ({formData.selectedServices.length}/{maxAllowed})
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {services.map((service) => (
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