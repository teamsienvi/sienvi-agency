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
  custom: { name: "Custom Plan", price: 0, services: 0 },
};

const serviceLabels: Record<string, string> = {
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
    if (!isAdvertising && profile.subscriptionStatus === "active" && profile.contractStatus === "not_signed") {
      return <Badge className="bg-blue-500">Awaiting Contract</Badge>;
    }
    if (!isAdvertising && profile.contractStatus === "signed" && profile.onboardingStatus !== "completed") {
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
    
    if (profile.contractStatus === "not_signed") {
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

          {/* Primary CTA - only show if there's a next action */}
          {getPrimaryCTA() && (
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

                  {/* Step 3: Contract - hidden for advertising */}
                  {profile.plan !== "advertising" && (
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
                    {profile.plan && (
                      <p className="text-2xl font-bold text-primary">
                        ${getPlanPrice().toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    )}
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

            {/* Contract Status Card - hidden for advertising */}
            {profile.plan !== "advertising" && (
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
