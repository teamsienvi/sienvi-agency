import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, UserPlus, Link, Mail, Copy, Check } from "lucide-react";

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

const AdminCreateClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
        navigate("/admin");
        return;
      }

      const response = await supabase.functions.invoke("create-client", {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      setCreatedClient(response.data.client);
      toast.success("Client created successfully!");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCheckoutLink = async () => {
    if (!createdClient) return;
    
    setGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-checkout-link", {
        body: {
          clientId: createdClient.id,
          clientEmail: createdClient.email,
          plan: createdClient.plan,
          customPrice: createdClient.custom_price,
          selectedServices: createdClient.selected_services,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      setCheckoutUrl(response.data.checkoutUrl);
      toast.success("Checkout link generated!");
    } catch (error: any) {
      console.error("Error generating checkout link:", error);
      toast.error(error.message || "Failed to generate checkout link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = async () => {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const maxAllowed = formData.plan === "custom" ? formData.maxServices : planLimits[formData.plan];

  // Show success state after client creation
  if (createdClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button variant="ghost" onClick={() => navigate("/admin/clients")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  Client Created Successfully
                </CardTitle>
                <CardDescription>
                  {createdClient.email} has been added to the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{createdClient.first_name} {createdClient.last_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plan</p>
                    <p className="font-medium capitalize">{createdClient.plan}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subscription Status</p>
                    <p className="font-medium capitalize">{createdClient.subscription_status.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contract Status</p>
                    <p className="font-medium capitalize">{createdClient.contract_status.replace("_", " ")}</p>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Post-Creation Actions</h3>
                  
                  {createdClient.subscription_status === "pending_payment" && (
                    <div className="space-y-3">
                      {!checkoutUrl ? (
                        <Button 
                          onClick={handleGenerateCheckoutLink} 
                          disabled={generatingLink}
                          className="w-full"
                        >
                          {generatingLink ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Link className="w-4 h-4 mr-2" />
                          )}
                          Generate Stripe Checkout Link
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-green-600 font-medium">Checkout link ready:</p>
                          <div className="flex gap-2">
                            <Input value={checkoutUrl} readOnly className="flex-1 text-xs" />
                            <Button onClick={copyToClipboard} variant="outline">
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Send this link to the client to complete payment
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button variant="outline" className="w-full" disabled>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Login Invite (Coming Soon)
                  </Button>

                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => navigate("/admin/clients")}
                  >
                    Go to Client Overview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={() => navigate("/admin/clients")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Client</h1>
              <p className="text-muted-foreground">
                Add a new or existing client to the system
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 space-y-8">
              {/* Section A: Client Identity */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Client Identity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="client@example.com"
                    />
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

              {/* Section B: Client Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Client Type</h3>
                <div className="space-y-2">
                  <Label>Is this a new or existing client?</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(v) => {
                      const isExisting = v === "existing";
                      setFormData((prev) => ({ 
                        ...prev, 
                        clientType: v as "new" | "existing",
                        subscriptionStatus: isExisting ? "active" : "pending_payment",
                        contractStatus: isExisting ? "signed" : "not_signed",
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Client (needs to pay)</SelectItem>
                      <SelectItem value="existing">Existing Client (already paying)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section C: Plan & Billing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Plan & Billing</h3>
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.plan === "custom" && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="customPrice">Monthly Amount ($)</Label>
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
                      <Label htmlFor="maxServices">Max Services (1-6)</Label>
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

              {/* Section D: Contract Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contract Status</h3>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Services ({formData.selectedServices.length}/{maxAllowed})
                </h3>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Admin Notes</h3>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any internal notes about this client..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Create Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminCreateClient;