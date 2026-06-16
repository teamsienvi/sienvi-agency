import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  onboardingStatus: string;
  onboardingCompletedAt: string | null;
  maxServices: number;
  selectedServices: string[];
  customPrice: number | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
}

const planDetails: Record<string, { name: string; price: number; services: number }> = {
  single: { name: "Single Service", price: 888, services: 1 },
  triple: { name: "Triple Automation", price: 2398.20, services: 3 },
  full: { name: "Full Automation", price: 3996, services: 6 },
  amazon: { name: "Amazon Design Package", price: 999, services: 1 },
  advertising: { name: "Advertising Package", price: 888, services: 7 },
  custom: { name: "Custom Plan", price: 0, services: 0 },
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

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);

  const isDiscovery = profile?.plan === "discovery" || profile?.plan === "custom-lms" || (profile?.selectedServices || []).includes("custom-tool");

  useEffect(() => {
    checkAuthAndFetchProfile();
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

      // Route users based on their status - enforce step completion
      // Advertising clients skip contract and onboarding
      const isAdvertising = clientProfile.plan === "advertising";
      
      if (clientProfile.subscriptionStatus === "pending_payment") {
        // User needs to complete payment - stay on dashboard to show payment CTA
      } else if (!isAdvertising && clientProfile.subscriptionStatus === "active" && clientProfile.contractStatus === "not_signed") {
        // User paid but hasn't signed contract - they can stay here or go to contract
      } else if (!isAdvertising && clientProfile.contractStatus === "signed" && clientProfile.onboardingStatus !== "completed") {
        // User signed contract but hasn't completed onboarding
      }
      // If all complete, just show the dashboard
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

  const getStatusBadge = () => {
    if (!profile) return null;
    const isAdvertising = profile.plan === "advertising";
    
    if (profile.subscriptionStatus === "pending_payment") {
      return <Badge className="bg-orange-500">Awaiting Payment</Badge>;
    }
    if (!isAdvertising && !isDiscovery && profile.subscriptionStatus === "active" && profile.contractStatus === "not_signed") {
      return <Badge className="bg-blue-500">Awaiting Contract</Badge>;
    }
    if (!isAdvertising && (isDiscovery || profile.contractStatus === "signed") && profile.onboardingStatus !== "completed") {
      return <Badge className="bg-purple-500">Onboarding In Progress</Badge>;
    }
    if (isAdvertising || profile.onboardingStatus === "completed") {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getProgress = () => {
    if (!profile) return 0;
    const isAdvertising = profile.plan === "advertising";
    if (isAdvertising) {
      // Advertising: only 2 steps (account + payment)
      let completed = 1;
      if (profile.subscriptionStatus === "active") completed++;
      return (completed / 2) * 100;
    }
    if (isDiscovery) {
      // Discovery skips contract: 3 steps (account + payment + onboarding)
      let completed = 1;
      if (profile.subscriptionStatus === "active") completed++;
      if (profile.onboardingStatus === "completed") completed++;
      return (completed / 3) * 100;
    }
    let completed = 1;
    if (profile.subscriptionStatus === "active") completed++;
    if (profile.contractStatus === "signed") completed++;
    if (profile.onboardingStatus === "completed") completed++;
    return (completed / 4) * 100;
  };

  const getPrimaryCTA = () => {
    if (!profile) return null;
    const isAdvertising = profile.plan === "advertising";
    
    if (profile.subscriptionStatus === "pending_payment") {
      return (
        <div className="space-y-3">
          <Button size="lg" className="w-full" disabled>
            <CreditCard className="w-5 h-5 mr-2" />
            Complete Payment (Check Email for Link)
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            An admin will send you a payment link via email. Contact support if you haven't received it.
          </p>
        </div>
      );
    }
    
    // Advertising clients don't need contract or onboarding
    if (isAdvertising) return null;
    
    if (profile.contractStatus === "not_signed" && !isDiscovery) {
      return (
        <Button size="lg" className="w-full" onClick={() => navigate("/contract")}>
          <FileSignature className="w-5 h-5 mr-2" />
          Sign Contract
        </Button>
      );
    }
    
    if (profile.onboardingStatus !== "completed") {
      return (
        <Button size="lg" className="w-full" onClick={() => navigate("/onboarding")}>
          <ClipboardList className="w-5 h-5 mr-2" />
          {profile.onboardingStatus === "not_started" ? "Start Onboarding" : "Continue Onboarding"}
        </Button>
      );
    }
    
    return null;
  };

  const getPlanPrice = () => {
    if (!profile) return 0;
    if (profile.plan === "custom" && profile.customPrice) {
      return profile.customPrice;
    }
    return planDetails[profile.plan || ""]?.price || 0;
  };

  const getPlanName = () => {
    if (!profile?.plan) return "No Plan Selected";
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome{profile.firstName ? `, ${profile.firstName}` : ""}!
                </h1>
                <p className="text-muted-foreground">{profile.email}</p>
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

          {/* Onboarding Completion Banner or Next Step CTA */}
          {profile.onboardingStatus === "completed" ? (
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
                    <a
                      href="mailto:teamsienvi@gmail.com"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-slate-50 h-10 px-4 py-2 text-indigo-600 font-semibold shadow-sm"
                    >
                      Email Support Team
                    </a>
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
                
                <div className="space-y-4">
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

                  {/* Step 2: Payment */}
                  <div className="flex items-center gap-3">
                    {profile.subscriptionStatus === "active" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">Payment Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.subscriptionStatus === "active" 
                          ? "Subscription active"
                          : "Awaiting payment"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Contract - hidden for advertising and discovery */}
                  {profile.plan !== "advertising" && !isDiscovery && (
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

                  {/* Step 4: Onboarding - hidden for advertising */}
                  {profile.plan !== "advertising" && (
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
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plan & Billing Card */}
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
                  <Badge variant={profile.subscriptionStatus === "active" ? "default" : "secondary"}>
                    {profile.subscriptionStatus === "active" ? "Active" : profile.subscriptionStatus.replace("_", " ")}
                  </Badge>
                </div>

                <Separator />

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

            {/* Contract Status Card - hidden for advertising and discovery */}
            {profile.plan !== "advertising" && !isDiscovery && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Contract
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Service Agreement</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.contractStatus === "signed" 
                        ? `Signed on ${new Date(profile.contractSignedAt!).toLocaleDateString()}`
                        : "Awaiting your signature"}
                    </p>
                  </div>
                  {profile.contractStatus === "signed" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : profile.subscriptionStatus === "active" ? (
                    <Button size="sm" onClick={() => navigate("/contract")}>
                      Sign Now
                    </Button>
                  ) : (
                    <Badge variant="outline">Complete payment first</Badge>
                  )}
                </div>
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
                <p className="font-medium">Need Help?</p>
                <p className="text-sm text-muted-foreground">
                  Contact us at <a href="mailto:support@sienvi.com" className="text-primary hover:underline">support@sienvi.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
