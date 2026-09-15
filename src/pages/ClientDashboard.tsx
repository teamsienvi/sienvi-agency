import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Circle, 
  CreditCard, 
  FileSignature, 
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  User,
  Package,
  Calendar,
  Settings,
  FileText,
  Shield,
  ShieldCheck,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { OnboardingResponsesModal } from "@/components/admin/OnboardingResponsesModal";

interface ClientSubscription {
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
  contractSignedAt?: string | null;
  contractSignature?: string | null;
  contractDetails?: any;
}

interface ClientProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  accountStatus: string;
  plan: string | null;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  contractStatus: string;
  contractSignedAt: string | null;
  contractSignature?: string | null;
  contractDetails?: any;
  onboardingStatus: string;
  onboardingCompletedAt: string | null;
  maxServices: number;
  selectedServices: string[];
  customPrice: number | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  subscriptions?: ClientSubscription[];
  coOwners?: Array<{ name: string; email: string; role: string }>;
  signers?: any[];
  requiresDualSignature?: boolean;
  isCommissionBased?: boolean;
  isCommissionBased?: boolean;
  isPartnership?: boolean;
  isNda?: boolean;
  entityName?: string | null;
}

const planDetails: Record<string, { name: string; price: number; services: number }> = {
  single: { name: "Single Service", price: 888, services: 1 },
  triple: { name: "Triple Automation", price: 2398.20, services: 3 },
  full: { name: "Full Automation", price: 3996, services: 6 },
  amazon: { name: "Amazon Design Package", price: 999, services: 1 },
  advertising: { name: "Advertising Package", price: 888, services: 7 },
  custom: { name: "Custom Plan", price: 0, services: 0 },
  prospect: { name: "Prospect Discovery", price: 0, services: 0 },
  partnership: { name: "Strategic Partnership", price: 0, services: 0 },
  nda: { name: "Strategic Partnership (NDA)", price: 0, services: 0 },
};

const serviceLabels: Record<string, string> = {
  // Automation Services
  "social-media-suite": "Social Media Suite",
  "ecommerce-operations": "E-Commerce Operations",
  "custom-website": "Custom Website Development",
  "seo-aeo": "SEO/AEO Package",
  "custom-lms": "Custom LMS Package",
  "custom-gpt": "Custom GPT Product",
  "custom-ai-assistant": "Custom AI Assistant",
  "custom-tool": "Custom Tool",
  "custom-agent": "Custom Agent",
  "custom-project-management": "Custom Project Management System",
  "custom-data-dashboard": "Custom Data Dashboard",
  "amazon-design": "Amazon Design Package",
  
  // Advertising Channels
  "channel-google": "Google Ads",
  "channel-meta": "Meta (Facebook/Instagram)",
  "channel-tiktok": "TikTok Ads",
  "channel-linkedin": "LinkedIn Ads",
  "channel-youtube": "YouTube Ads",
  "channel-pinterest": "Pinterest Ads",
  "channel-x": "X (Twitter) Ads",
  "channel-amazon": "Amazon Ads",

  // Legacy mappings for safety
  "social-media": "Social Media Management",
  "content-creation": "Content Creation",
  "email-marketing": "Email Marketing",
  "seo": "SEO Optimization",
  "paid-ads": "Paid Advertising",
  "analytics": "Analytics & Reporting",
  "web-design": "Web Design",
  "branding": "Branding",
  "video-production": "Video Production",
};

const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramClientId = searchParams.get("clientId");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [checkingOutSubId, setCheckingOutSubId] = useState<string | null>(null);
  const [showResponses, setShowResponses] = useState(false);

  const isPartnership = Boolean(
    profile?.isPartnership ||
    profile?.plan === "partnership" ||
    profile?.plan === "nda" ||
    profile?.email === "info@fabcheer.com" ||
    profile?.contractDetails?.isNda ||
    profile?.contractDetails?.relationshipType === "partnership"
  );
  const isDiscovery = profile?.plan === "discovery" || profile?.plan === "prospect" || profile?.plan === "custom-lms";
  const isProspect = profile?.plan === "prospect";

  useEffect(() => {
    checkAuthAndFetchProfile();

    // Auto-refresh profile when tab regains focus (e.g. after Stripe payment in new tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !loading) {
        checkAuthAndFetchProfile();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      // Check for existing session - don't auto-login
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // User is not logged in - redirect to login
        navigate("/login");
        return;
      }

      const response = await supabase.functions.invoke("get-client-profile", {
        body: paramClientId ? { clientId: paramClientId } : undefined,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Handle admin without client profile
      if (response.data.isAdmin && !response.data.profile) {
        navigate("/admin/dashboard");
        return;
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const clientProfile = response.data.profile;
      setProfile(clientProfile);
      setIsAdmin(response.data.isAdmin);

      // Route users based on onboarding sequence: Unique sign-up link -> Contract -> Payment -> Full Access
      // Skip enforcement for admins so they don't get stuck when testing client links
      const isAdvertising = clientProfile.plan === "advertising";
      const isClientDiscovery = clientProfile.plan === "discovery" || clientProfile.plan === "prospect" || clientProfile.plan === "custom-lms";
      const isClientPartnership = clientProfile.plan === "partnership" || clientProfile.plan === "nda" || clientProfile.email === "info@fabcheer.com" || clientProfile.isPartnership;
      
      if (!response.data.isAdmin && !isAdvertising && !isClientDiscovery && !isClientPartnership && clientProfile.contractStatus === "not_signed" && clientProfile.subscriptionStatus === "pending_payment") {
        // Step 2: Enforce Contract Signing before Payment & Full Access
        navigate("/contract");
        return;
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleManageBilling = async () => {
    if (!profile?.email) return;
    
    setManagingBilling(true);
    try {
      const response = await supabase.functions.invoke("create-customer-portal-session", {
        body: { email: profile.email },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      window.location.href = response.data.url;
    } catch (error: any) {
      console.error("Error opening billing portal:", error);
      toast.error("Unable to open billing portal. Please contact support.");
    } finally {
      setManagingBilling(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!profile) return;
    
    setManagingBilling(true);
    try {
      const plan = profile.plan || "single";
      const services = profile.selectedServices || [];
      const adChannels = services.filter(s => s.startsWith("channel-"));
      const regularServices = services.filter(s => !s.startsWith("channel-"));
      
      // For standard plans (single, triple, full) with proper services, use the checkout summary page
      if (["single", "triple", "full"].includes(plan)) {
        const singleService = plan === "single" && regularServices.length === 1 ? regularServices[0] : null;
        const url = singleService 
          ? `/checkout-summary?plan=${plan}&service=${singleService}`
          : `/checkout-summary?plan=${plan}`;
        navigate(url);
        return;
      }
      
      if (plan === "advertising") {
        // Store ad channels in session storage for checkout summary
        sessionStorage.setItem('selectedAdvertisingChannels', JSON.stringify(adChannels));
        navigate("/checkout-summary?plan=advertising");
        return;
      }
      
      if (plan === "amazon") {
        navigate("/checkout-summary?plan=single&service=amazon-design");
        return;
      }
      
      // For custom plans: create Stripe session directly via create-checkout-session
      const customPrice = profile.customPrice || 888;
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan: "custom",
          customPrice,
          customerEmail: profile.email,
          selectedServices: services,
          advertisingChannels: adChannels.length > 0 ? adChannels : undefined,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Stripe checkout opened in a new tab");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Error starting checkout:", error);
      toast.error(error.message || "Unable to start checkout. Please contact support.");
    } finally {
      setManagingBilling(false);
    }
  };

  // Per-subscription checkout for multi-sub clients
  const handleSubCheckout = async (sub: ClientSubscription) => {
    if (!profile) return;
    setCheckingOutSubId(sub.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan: "custom",
          customPrice: sub.monthlyAmount,
          customerEmail: profile.email,
          selectedServices: sub.selectedServices || [],
          subscriptionId: sub.id,
          subscriptionLabel: sub.label,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success(`Checkout opened for ${sub.label}`);
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Error starting sub checkout:", error);
      toast.error(error.message || "Unable to start checkout. Please contact support.");
    } finally {
      setCheckingOutSubId(null);
    }
  };

  const getStatusBadge = () => {
    if (!profile) return null;

    if (isPartnership) {
      if (profile.contractStatus === "signed") {
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-medium">Strategic Partner</Badge>;
      }
      return <Badge className="bg-purple-500 hover:bg-purple-600 text-white font-medium">Awaiting NDA Signature</Badge>;
    }
    
    if (isProspect && profile.onboardingStatus === "completed") {
      return <Badge className="bg-teal-500 hover:bg-teal-600">Discovery Complete</Badge>;
    }
    if (isProspect) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Prospect</Badge>;
    }
    if (!isDiscovery && profile.plan !== "advertising" && profile.contractStatus === "not_signed") {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Awaiting Contract</Badge>;
    }
    if (profile.subscriptionStatus === "pending_payment") {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Awaiting Payment</Badge>;
    }
    if (profile.onboardingStatus !== "completed") {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Onboarding In Progress</Badge>;
    }
    if (profile.onboardingStatus === "completed") {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getProgress = () => {
    if (!profile) return 0;
    if (isPartnership) {
      let completed = 1; // Account Created
      if (profile.contractStatus === "signed") completed += 2; // NDA Signed & Active
      return (completed / 3) * 100;
    }
    if (isProspect) {
      let completed = 1; // Account Created
      if (profile.onboardingStatus === "completed") completed++;
      return (completed / 2) * 100;
    }
    if (isDiscovery) {
      let completed = 1;
      if (profile.subscriptionStatus === "active") completed++;
      if (profile.onboardingStatus === "completed") completed++;
      return (completed / 3) * 100;
    }
    // Progression: 1. Account Created -> 2. Contract Signed -> 3. Payment Active -> 4. Workspace Access & Onboarding
    let completed = 1;
    if (profile.contractStatus === "signed") completed++;
    if (profile.subscriptionStatus === "active") completed++;
    if (profile.onboardingStatus === "completed") completed++;
    return (completed / 4) * 100;
  };

  const getPrimaryCTA = () => {
    if (!profile) return null;

    // Partnership CTA: review & sign NDA (no payment)
    if (isPartnership) {
      if (profile.contractStatus !== "signed") {
        return (
          <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md" onClick={() => navigate(paramClientId ? `/contract?clientId=${paramClientId}` : "/contract")}>
            <FileSignature className="w-5 h-5 mr-2" />
            Review & Sign Confidentiality Agreement (NDA)
          </Button>
        );
      }
      return null;
    }
    
    // Prospect CTA: skip contract + payment, go straight to discovery
    if (isProspect) {
      if (profile.onboardingStatus !== "completed") {
        return (
          <Button size="lg" className="w-full" onClick={() => navigate(paramClientId ? `/onboarding?clientId=${paramClientId}` : "/onboarding")}>
            <ClipboardList className="w-5 h-5 mr-2" />
            {profile.onboardingStatus === "not_started" ? "Start Discovery Questionnaire" : "Continue Discovery Questionnaire"}
          </Button>
        );
      }
      return null;
    }

    // Step 2: Contract Signing
    if (profile.contractStatus === "not_signed" && !isDiscovery && profile.plan !== "advertising") {
      return (
        <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" onClick={() => navigate(paramClientId ? `/contract?clientId=${paramClientId}` : "/contract")}>
          <FileSignature className="w-5 h-5 mr-2" />
          Review & Sign Service Agreement
        </Button>
      );
    }

    // Step 3: Payment
    if (profile.subscriptionStatus === "pending_payment") {
      return (
        <div className="space-y-3">
          <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={handleCompletePayment} disabled={managingBilling}>
            {managingBilling ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            Complete Payment
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {profile.contractStatus === "signed" 
              ? "Agreement signed! Complete your payment to unlock full workspace access."
              : "Complete your payment to continue onboarding."}
          </p>
        </div>
      );
    }
    
    // Step 4: Full Access / Onboarding
    if (profile.onboardingStatus !== "completed") {
      return (
        <Button size="lg" className="w-full" onClick={() => navigate(paramClientId ? `/onboarding?clientId=${paramClientId}` : "/onboarding")}>
          <ClipboardList className="w-5 h-5 mr-2" />
          {profile.onboardingStatus === "not_started" ? "Start Onboarding Questionnaire" : "Continue Onboarding"}
        </Button>
      );
    }
    
    return null;
  };

  const getPlanPrice = () => {
    if (!profile) return 0;
    if (isPartnership) return 0;
    if (profile.plan === "custom" && profile.customPrice) {
      return profile.customPrice;
    }
    return planDetails[profile.plan || ""]?.price || 0;
  };

  const getPlanName = () => {
    if (!profile?.plan) return "No Plan Selected";
    if (isPartnership) {
      return "Strategic Partnership (Mutual NDA)";
    }
    if (profile.isCommissionBased) {
      return "Custom (Commission-based)";
    }
    if (profile.plan === "custom") {
      return `Custom Plan`;
    }
    return planDetails[profile.plan]?.name || profile.plan;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Setting Up Your Account</CardTitle>
              <CardDescription>
                We're creating your client profile. Please wait a moment...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {paramClientId && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Settings className="w-4 h-4" />
          Previewing Client Dashboard
        </div>
      )}
      <SEOHead title="Client Dashboard | Sienvi" description="Client Workspace Dashboard" noindex={true} />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">
                    Welcome{profile.firstName ? `, ${profile.firstName}` : ""}!
                  </h1>
                  {profile.coOwners && profile.coOwners.length > 0 && (
                    <Badge variant="outline" className="bg-indigo-50/80 border-indigo-200 text-indigo-800 text-xs font-semibold px-2.5 py-0.5">
                      {profile.entityName || "In the Dome"} · Co-Founder
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
                {profile.coOwners && profile.coOwners.length > 0 && (
                  <p className="text-xs text-indigo-600 mt-1 font-medium">
                    Connected Team: {profile.coOwners.map(c => c.name).join(" & ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")}>
                  Admin Panel
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contract Signing Required Banner (Always Highest Priority for pending or partially signed contracts) */}
          {!isDiscovery && profile.plan !== "advertising" && profile.contractStatus !== "signed" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className={isPartnership ? "border-purple-500/30 bg-gradient-to-br from-purple-50/95 via-indigo-50/80 to-white backdrop-blur-md overflow-hidden relative shadow-md" : "border-blue-500/30 bg-gradient-to-br from-blue-50/95 via-indigo-50/80 to-white backdrop-blur-md overflow-hidden relative shadow-md"}>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <FileSignature className={isPartnership ? "w-40 h-40 text-purple-600" : "w-40 h-40 text-blue-600"} />
                </div>
                <CardContent className="pt-8 pb-6 px-6 sm:px-8 space-y-5">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className={isPartnership ? "p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg shadow-purple-500/20 flex-shrink-0 text-white" : "p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-500/20 flex-shrink-0 text-white"}>
                      <FileSignature className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={isPartnership ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold tracking-wider" : "bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-wider"}>
                          {isPartnership ? "PARTNERSHIP NDA REQUIRED" : profile.contractStatus === "partially_signed" ? "1 OF 2 SIGNATURES COMPLETED" : "ACTION REQUIRED"}
                        </Badge>
                        {profile.requiresDualSignature && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                            Co-Signatures Required
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {isPartnership
                          ? "Confidentiality & Non-Disclosure Agreement (NDA) Ready for Review"
                          : profile.contractStatus === "partially_signed"
                          ? "Service Agreement Partially Signed (Awaiting 2nd Signature)"
                          : (profile.contractDetails?.uploadedContractName
                              ? "New Service Agreement Ready for Review & Signature"
                              : "Service Agreement Awaiting Signature")}
                      </h2>
                      <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                        {isPartnership
                          ? `We have prepared the "${profile.contractDetails?.uploadedContractName || 'CHEERCPT — Confidentiality Agreement'}" for ${profile.firstName || 'partner'} to review and digitally sign to confirm our strategic collaboration.`
                          : profile.contractStatus === "partially_signed"
                          ? "One of the co-founders has completed their signature. Please review and sign to complete full agreement execution."
                          : (profile.contractDetails?.uploadedContractName
                              ? `We have prepared the "${profile.contractDetails.uploadedContractName}" for ${profile.entityName || 'the client'} to review and digitally sign.`
                              : "Please review and digitally sign your client service agreement to proceed with your active services.")}
                      </p>
                    </div>
                  </div>

                  <Separator className={isPartnership ? "bg-purple-100" : "bg-blue-100"} />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className={isPartnership ? "w-4 h-4 text-purple-600" : "w-4 h-4 text-blue-600"} />
                      <span>Legally binding electronic signature powered by Sienvi Security</span>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {profile.contractDetails?.uploadedProposalUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(profile.contractDetails.uploadedProposalUrl, "_blank")}
                          className="bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          <FileText className="w-4 h-4 mr-1.5" />
                          View Proposal PDF
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => navigate(paramClientId ? `/contract?clientId=${paramClientId}` : "/contract")}
                        className={isPartnership ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md shadow-purple-500/20 px-5" : "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 px-5"}
                      >
                        <FileSignature className="w-4 h-4 mr-2" />
                        {isPartnership ? "Review & Sign NDA" : "Review & Sign Agreement"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : isProspect && profile.onboardingStatus === "completed" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-teal-500/25 bg-gradient-to-br from-teal-50/90 via-emerald-50/80 to-white backdrop-blur-md overflow-hidden relative shadow-md">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <CheckCircle2 className="w-40 h-40 text-teal-600" />
                </div>
                <CardContent className="pt-8 pb-6 px-6 sm:px-8 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-teal-500/20 flex-shrink-0">
                      <span className="text-2xl">🙌</span>
                    </div>
                    <div className="space-y-1">
                      <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-semibold tracking-wider">DISCOVERY COMPLETE</Badge>
                      <h2 className="text-2xl font-bold text-slate-800">Thank You, {profile.firstName}!</h2>
                      <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                        We've received your discovery questionnaire responses. Our team is reviewing your answers and will reach out with a tailored proposal for your business needs.
                      </p>
                    </div>
                  </div>
                  <Separator className="bg-teal-100" />
                  <div className="bg-white/60 backdrop-blur-sm border border-slate-100 p-4 rounded-xl space-y-3 shadow-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-slate-800">What happens next?</p>
                      <p className="text-xs text-muted-foreground">
                        A member of our team will review your responses and schedule a follow-up conversation. 
                        If you're ready to move forward, we'll set you up with a tailored service plan — no need to create a new account.
                      </p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" onClick={() => setShowResponses(true)} className="bg-white hover:bg-slate-50 text-teal-700 border-teal-200">
                        <FileText className="w-4 h-4 mr-2" />
                        View Your Responses
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : profile.onboardingStatus === "completed" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-indigo-500/25 bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-white backdrop-blur-md overflow-hidden relative shadow-md">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <CheckCircle2 className="w-40 h-40 text-indigo-600" />
                </div>
                <CardContent className="pt-8 pb-6 px-6 sm:px-8 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 flex-shrink-0 animate-bounce">
                      <span className="text-2xl">🎉</span>
                    </div>
                    <div className="space-y-1">
                      <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold tracking-wider">ONBOARDING COMPLETE</Badge>
                      <h2 className="text-2xl font-bold text-slate-800">You're All Set, {profile.firstName}!</h2>
                      <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                        We have successfully registered your responses. Our technical team is now designing and building your custom automation workflows.
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-indigo-100" />

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm border border-slate-100 p-4 rounded-xl space-y-2 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">1</div>
                      <p className="font-semibold text-sm text-slate-800">Strategy Analysis</p>
                      <p className="text-xs text-muted-foreground">Our team reviews your assets, goals, and primary bottleneck areas.</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm border border-slate-100 p-4 rounded-xl space-y-2 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-sm">2</div>
                      <p className="font-semibold text-sm text-slate-800">Workflow Building</p>
                      <p className="text-xs text-muted-foreground">We configure integrations, design SOPs, and build database structures.</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm border border-slate-100 p-4 rounded-xl space-y-2 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">3</div>
                      <p className="font-semibold text-sm text-slate-800">Delivery & Launch</p>
                      <p className="text-xs text-muted-foreground">We deliver your workspace access and invite you to our review call (2-3 business days).</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Need to add more details? Feel free to contact our specialists directly.
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" onClick={() => setShowResponses(true)} className="bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200">
                        <FileText className="w-4 h-4 mr-2" />
                        View Responses
                      </Button>
                      <a
                        href="mailto:info@sienvi.com,teamsienvi@gmail.com"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-slate-50 h-10 px-4 py-2 text-indigo-600 font-semibold shadow-sm"
                      >
                        Email Support Team
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : getPrimaryCTA() && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                {getPrimaryCTA()}
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  Setup Progress
                </CardTitle>
                <CardDescription>Complete all steps to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Progress value={getProgress()} className="h-3" />
                
                {/* Steps for partnership: 3-step progress (no payment) */}
                {isPartnership ? (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Partner Account Created</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {profile.contractStatus === "signed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Confidentiality Agreement (NDA)</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.contractStatus === "signed" && profile.contractSignedAt
                            ? `Signed ${new Date(profile.contractSignedAt).toLocaleDateString()}`
                            : "Pending partner signature"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {profile.contractStatus === "signed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Strategic Partnership</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.contractStatus === "signed" ? "Active Collaboration" : "Pending NDA"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : isProspect ? (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Account Created</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {profile.onboardingStatus === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Discovery Questionnaire</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.onboardingStatus === "completed"
                            ? "Completed"
                            : profile.onboardingStatus === "in_progress"
                            ? "In progress..."
                            : "Not started"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                  {/* Step 1: Account Created */}
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Account Created</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Contract Signed - hidden for discovery */}
                  {!isDiscovery && (
                    <div className="flex items-center gap-3">
                      {profile.contractStatus === "signed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Contract Signed</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.contractStatus === "signed" && profile.contractSignedAt
                            ? `Signed ${new Date(profile.contractSignedAt).toLocaleDateString()}`
                            : "Pending signature"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment / Commission Terms */}
                  <div className="flex items-center gap-3">
                    {profile.subscriptionStatus === "active" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {profile.isCommissionBased ? "Commission Terms Active" : "Payment Completed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.isCommissionBased
                          ? (profile.subscriptionStatus === "active" ? "Revenue share structure active" : "Awaiting activation")
                          : profile.subscriptionStatus === "active" 
                          ? "Subscription active"
                          : "Awaiting payment"}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Onboarding */}
                  <div className="flex items-center gap-3">
                    {profile.onboardingStatus === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">Onboarding Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.onboardingStatus === "completed"
                          ? "All set!"
                          : profile.onboardingStatus === "in_progress"
                          ? "In progress..."
                          : "Not started"}
                      </p>
                    </div>
                  </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Plan & Billing — Multi-subscription or single card */}
            {profile.subscriptions && profile.subscriptions.length > 0 ? (
              <>
                {/* Combined total header */}
                <Card className="md:col-span-1 overflow-visible">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Your Subscriptions
                    </CardTitle>
                    <CardDescription>
                      {profile.subscriptions.length} subscription{profile.subscriptions.length !== 1 ? "s" : ""} · Combined total:{" "}
                      {profile.isCommissionBased ? (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Commission-Based (Performance Share)
                        </span>
                      ) : (
                        <span className="font-semibold text-foreground">
                          ${profile.subscriptions.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 overflow-visible">
                    <div className="grid sm:grid-cols-2 gap-4 pb-1">
                      {profile.subscriptions.map((sub) => {
                        const isSubCommission = Boolean(profile.isCommissionBased && (sub.monthlyAmount === 0 || !sub.monthlyAmount));
                        return (
                          <div
                            key={sub.id}
                            className="relative flex flex-col rounded-xl border p-5 transition-shadow hover:shadow-md border-slate-200 bg-white shadow-sm"
                          >
                            {/* Header */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-base leading-snug text-slate-800">{sub.label}</p>
                                {isSubCommission && (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium shrink-0">
                                    Commission
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                {isSubCommission ? (
                                  <div className="space-y-0.5">
                                    <span className="text-xl font-bold text-slate-900">
                                      Commission-Based
                                    </span>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {sub.notes || "Performance / Revenue Share Structure"}
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-2xl font-bold text-slate-900">
                                      ${sub.monthlyAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/mo</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2.5 mb-4">
                              {sub.billingDay && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span>Billed on the <span className="font-semibold text-slate-800">{getOrdinalSuffix(sub.billingDay)}</span></span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                {sub.subscriptionStatus === "active" ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-xs font-medium">
                                    ✓ Active
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-xs font-medium">
                                    Awaiting Payment
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Services — push to fill remaining space */}
                            {sub.selectedServices && sub.selectedServices.length > 0 && (
                              <div className="flex-1">
                                <Separator className="mb-3" />
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Services</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {sub.selectedServices.map((service) => (
                                    <Badge key={service} variant="outline" className="text-xs px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-600 font-normal">
                                      {serviceLabels[service] || service}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Per-subscription checkout for pending_payment */}
                            {sub.subscriptionStatus === "pending_payment" && !sub.stripeSubscriptionId && !isSubCommission && (
                              <div className="mt-auto pt-4">
                                <Button
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                                  onClick={() => handleSubCheckout(sub)}
                                  disabled={checkingOutSubId === sub.id}
                                >
                                  {checkingOutSubId === sub.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <CreditCard className="w-4 h-4 mr-2" />
                                  )}
                                  Complete Payment
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {profile.subscriptionStatus === "active" && profile.stripeCustomerId && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleManageBilling}
                          disabled={managingBilling}
                        >
                          {managingBilling ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Settings className="w-4 h-4 mr-2" />
                          )}
                          Manage Billing
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : isPartnership ? (
              /* Strategic Partnership & NDA Card */
              <Card className="border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-purple-950">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      Strategic Partnership
                    </CardTitle>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-medium">
                      Mutual NDA
                    </Badge>
                  </div>
                  <CardDescription>
                    Confidentiality, non-disclosure, and strategic collaboration agreement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-white/80 border border-purple-100/80">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Partner Entity</p>
                      <p className="font-semibold text-slate-900">{profile.entityName || "FabCheer"}</p>
                      <p className="text-xs text-slate-500">Corey Robert Rickett</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/80 border border-purple-100/80">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Financial Obligation</p>
                      <p className="font-semibold text-purple-700">$0.00 / None</p>
                      <p className="text-xs text-slate-500">Non-commercial partnership</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/80 border border-purple-100/80">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Agreement Type</p>
                      <p className="font-semibold text-slate-900">Mutual NDA & Non-Use</p>
                      <p className="text-xs text-slate-500">5-Year Confidentiality Period</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/80 border border-purple-100/80">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Status</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {profile.contractStatus === "signed" ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-700 text-xs">Executed & Active</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-purple-700 text-xs">Pending Digital Signature</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Original single-plan card for backward compatibility */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Your Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{getPlanName()}</p>
                    </div>
                    {!isProspect && (
                    <Badge variant={profile.subscriptionStatus === "active" ? "default" : "secondary"}>
                      {profile.isCommissionBased
                        ? "Commission-Based"
                        : profile.subscriptionStatus === "active" ? "Active" : profile.subscriptionStatus.replace("_", " ")}
                    </Badge>
                    )}
                  </div>

                  <Separator />

                  {!isProspect && (
                  <div>
                    <p className="text-sm font-medium mb-2">Services Included ({profile.maxServices || 0})</p>
                    {profile.selectedServices && profile.selectedServices.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.selectedServices.map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {serviceLabels[service] || service}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No services selected yet</p>
                    )}
                  </div>
                  )}

                  {profile.subscriptionStatus === "active" && profile.stripeCustomerId && (
                    <>
                      <Separator />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleManageBilling}
                        disabled={managingBilling}
                      >
                        {managingBilling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Settings className="w-4 h-4 mr-2" />
                        )}
                        Manage Billing
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents & Agreements Card - hidden for discovery */}
            {!isDiscovery && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  {isPartnership ? "Partnership Documents & NDA" : "Documents & Agreements"}
                </CardTitle>
                <CardDescription>
                  {isPartnership 
                    ? "Review strategic partnership agreements and confidentiality documents"
                    : "Review proposals, scopes of work, and active legal agreements"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Proposal Document (if present) */}
                {profile.contractDetails?.uploadedProposalUrl && !isPartnership && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-white text-[10px] py-0 px-2 font-semibold">PROPOSAL</Badge>
                        <p className="font-semibold text-sm text-slate-900">
                          {profile.contractDetails.uploadedProposalName || "B2B Revenue Pipeline & Wholesale Portal Proposal"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Proposal document prepared for your business review
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold shrink-0"
                      onClick={() => window.open(profile.contractDetails.uploadedProposalUrl, "_blank")}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      View Proposal PDF
                    </Button>
                  </div>
                )}

                {/* Primary / Active Agreement */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant={profile.contractStatus === "signed" ? "default" : "secondary"} 
                        className={
                          profile.contractStatus === "signed" 
                            ? "bg-emerald-600 text-white text-[10px]" 
                            : profile.contractStatus === "partially_signed"
                            ? "bg-amber-500 text-white text-[10px]"
                            : isPartnership
                            ? "bg-purple-100 text-purple-800 text-[10px]"
                            : "bg-amber-100 text-amber-800 text-[10px]"
                        }
                      >
                        {profile.contractStatus === "signed" 
                          ? "✓ SIGNED" 
                          : profile.contractStatus === "partially_signed"
                          ? "1 OF 2 SIGNED"
                          : "AWAITING SIGNATURE"}
                      </Badge>
                      <p className="font-semibold text-sm text-slate-900">
                        {profile.contractDetails?.uploadedContractName || (isPartnership ? "CHEERCPT - CONFIDENTIALITY, NON-USE, NON-BUILD & FEEDBACK AGREEMENT.pdf" : "Service Agreement")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {profile.contractStatus === "signed"
                        ? `Signed on ${profile.contractSignedAt ? new Date(profile.contractSignedAt).toLocaleDateString() : "file"}`
                        : profile.contractStatus === "partially_signed"
                        ? "1 of 2 co-signatures completed. Awaiting full execution."
                        : isPartnership
                        ? "Mutual confidentiality and non-disclosure agreement requiring digital signature"
                        : "Legal services agreement requiring digital signature"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {profile.contractStatus === "signed" ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => window.open(`/contract?view=true${paramClientId ? `&clientId=${paramClientId}` : ""}`, "_blank")}
                          className="text-xs"
                        >
                          View Signed Copy
                        </Button>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        className={isPartnership ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 shadow-sm" : "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 shadow-sm"} 
                        onClick={() => navigate(paramClientId ? `/contract?clientId=${paramClientId}` : "/contract")}
                      >
                        <FileSignature className="w-3.5 h-3.5 mr-1.5" />
                        {profile.contractStatus === "partially_signed" ? "Sign / View Status" : isPartnership ? "Review & Sign NDA" : "Review & Sign"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Per-subscription scopes (if multiple exist) */}
                {profile.subscriptions && profile.subscriptions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription Scopes</p>
                    {profile.subscriptions.map((sub) => {
                      const isSubCommission = Boolean(profile.isCommissionBased && (sub.monthlyAmount === 0 || !sub.monthlyAmount));
                      return (
                        <div key={`sub-scope-${sub.id}`} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0 text-slate-600">
                          <span className="font-medium">{sub.label}</span>
                          <Badge variant="outline" className="text-[10px] text-slate-500">
                            {isSubCommission ? "Commission-Based" : `$${sub.monthlyAmount}/mo`} · {sub.subscriptionStatus === "active" ? "Active" : sub.subscriptionStatus}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Previous / Archived Agreements */}
                {profile.contractDetails?.previousContractUrl && (
                  <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                    <div className="truncate mr-2">
                      <span className="font-medium text-slate-700">Archived Agreement: </span>
                      <span className="truncate">{profile.contractDetails.previousContractName || "Previous Services Agreement"}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-slate-600 hover:text-slate-900 shrink-0"
                      onClick={() => window.open(profile.contractDetails.previousContractUrl, "_blank")}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      View Original
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{new Date(profile.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Status</span>
                  <Badge variant="outline" className="text-xs">
                    {profile.accountStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="font-medium text-slate-800">Need Help?</p>
                <p className="text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                  <span>Contact us at</span>
                  <a href="mailto:info@sienvi.com" className="text-primary font-medium hover:underline">info@sienvi.com</a>
                  <span>or</span>
                  <a href="mailto:teamsienvi@gmail.com" className="text-primary font-medium hover:underline">teamsienvi@gmail.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {profile && (
          <OnboardingResponsesModal
            open={showResponses}
            onOpenChange={setShowResponses}
            clientId={profile.id}
            clientName={profile.firstName || profile.email}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
