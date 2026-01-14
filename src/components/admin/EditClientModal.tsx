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
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    plan: "single" as "single" | "triple" | "full" | "custom",
    monthlyAmount: 888,
    maxServices: 1,
    selectedServices: [] as string[],
    subscriptionStatus: "pending_payment" as string,
    isActive: true,
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        clientName: client.clientName || "",
        email: client.email || "",
        plan: (client.plan as typeof formData.plan) || "single",
        monthlyAmount: client.customPrice || 888,
        maxServices: client.maxServices || 1,
        selectedServices: client.selectedServices || [],
        subscriptionStatus: client.subscriptionStatus || "pending_payment",
        isActive: client.isActive,
        notes: client.notes || "",
      });
    }
  }, [client]);

  const handlePlanChange = (plan: string) => {
    const limits: Record<string, { amount: number; services: number }> = {
      single: { amount: 888, services: 1 },
      triple: { amount: 2398.20, services: 3 },
      full: { amount: 3996, services: 6 },
      custom: { amount: formData.monthlyAmount, services: formData.maxServices },
    };

    const planConfig = limits[plan] || limits.single;
    setFormData((prev) => ({
      ...prev,
      plan: plan as typeof prev.plan,
      monthlyAmount: plan === "custom" ? prev.monthlyAmount : planConfig.amount,
      maxServices: plan === "custom" ? prev.maxServices : planConfig.services,
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
    if (!client) return;
    
    if (!formData.clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
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

      const response = await supabase.functions.invoke("update-client", {
        body: {
          clientId: client.id,
          ...formData,
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

  const maxAllowed = formData.plan === "custom" ? formData.maxServices : planLimits[formData.plan];

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
              <Label>Plan Type *</Label>
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
          {formData.plan === "custom" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
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
                <Label htmlFor="edit-maxServices">Max Services (1-6) *</Label>
                <Input
                  id="edit-maxServices"
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