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

const AdminCreateClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sendingLoginInvite, setSendingLoginInvite] = useState(false);
  const [sendingCheckoutEmail, setSendingCheckoutEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
      // Refresh the session to ensure a valid access token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        toast.error("Session expired. Please log in again.");
        navigate("/admin");
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

  const handleSendLoginInvite = async () => {
    if (!createdClient) return;
    
    setSendingLoginInvite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("send-login-invite", {
        body: {
          clientId: createdClient.id,
          clientEmail: createdClient.email,
          clientName: `${createdClient.first_name || ""} ${createdClient.last_name || ""}`.trim(),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      toast.success("Login invite sent successfully!");
    } catch (error: any) {
      console.error("Error sending login invite:", error);
      toast.error(error.message || "Failed to send login invite");
    } finally {
      setSendingLoginInvite(false);
    }
  };

  const handleSendCheckoutEmail = async () => {
    if (!createdClient || !checkoutUrl) return;
    
    setSendingCheckoutEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("send-checkout-email", {
        body: {
          clientId: createdClient.id,
          clientEmail: createdClient.email,
          clientName: `${createdClient.first_name || ""} ${createdClient.last_name || ""}`.trim(),
          checkoutUrl: checkoutUrl,
          plan: createdClient.plan,
          price: createdClient.custom_price,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      toast.success("Checkout email sent successfully!");
    } catch (error: any) {
      console.error("Error sending checkout email:", error);
      toast.error(error.message || "Failed to send checkout email");
    } finally {
      setSendingCheckoutEmail(false);
    }
  };

  const maxAllowed = formData.plan === "custom" 
    ? (parseInt(formData.maxServices as any) || 0) 
    : planConfigs[formData.plan].maxServices;
  const generalServicesCount = formData.selectedServices.filter(s => !s.startsWith("channel-")).length;

  // Show success state after client creation
  if (createdClient) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-800">
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
                        <div className="space-y-3">
                          <p className="text-sm text-green-600 font-medium">Checkout link ready:</p>
                          <div className="flex gap-2">
                            <Input value={checkoutUrl} readOnly className="flex-1 text-xs" />
                            <Button onClick={copyToClipboard} variant="outline">
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          <Button 
                            onClick={handleSendCheckoutEmail} 
                            variant="secondary" 
                            className="w-full"
                            disabled={sendingCheckoutEmail}
                          >
                            {sendingCheckoutEmail ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4 mr-2" />
                            )}
                            Email Checkout Link to Client
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleSendLoginInvite}
                    disabled={sendingLoginInvite}
                  >
                    {sendingLoginInvite ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Login Invite
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
    <div className="min-h-screen bg-gray-50 text-slate-800">
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.plan === "custom" && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="maxServices">Max Services</Label>
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
                                maxServices: value,
                                selectedServices: prev.selectedServices.slice(0, value),
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
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="bg-background cursor-pointer text-foreground file:text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Note for Admins:</strong> This is for custom plans only. If you upload a custom PDF contract, it will be presented to the client during onboarding instead of the standard template.
                      </p>
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
                  {formData.plan === "amazon" 
                    ? "Selected Package" 
                    : formData.plan === "custom"
                      ? "Selected Services"
                      : `Services (${formData.selectedServices.length}/${maxAllowed})`}
                </h3>
                {formData.plan === "amazon" ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">Amazon Design Package</p>
                <p className="text-sm text-muted-foreground">$999 one-time fee - Professional listing design and optimization</p>
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