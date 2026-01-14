import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No session - redirect to client login page
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

      if (response.data.error) {
        // No profile found - might be admin-only account
        if (response.data.isAdmin) {
          navigate("/admin/dashboard");
          return;
        }
        throw new Error(response.data.error);
      }

      setProfile(response.data.profile);
      setIsAdmin(response.data.isAdmin);
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

  const getStatusBadge = () => {
    if (!profile) return null;
    
    if (profile.subscriptionStatus === "pending_payment") {
      return <Badge className="bg-orange-500">Awaiting Payment</Badge>;
    }
    if (profile.subscriptionStatus === "active" && profile.contractStatus === "not_signed") {
      return <Badge className="bg-blue-500">Awaiting Contract</Badge>;
    }
    if (profile.contractStatus === "signed" && profile.onboardingStatus !== "completed") {
      return <Badge className="bg-purple-500">Onboarding In Progress</Badge>;
    }
    if (profile.onboardingStatus === "completed") {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getProgress = () => {
    if (!profile) return 0;
    let completed = 1; // Account created
    if (profile.subscriptionStatus === "active") completed++;
    if (profile.contractStatus === "signed") completed++;
    if (profile.onboardingStatus === "completed") completed++;
    return (completed / 4) * 100;
  };

  const getPrimaryCTA = () => {
    if (!profile) return null;
    
    if (profile.subscriptionStatus === "pending_payment") {
      return (
        <Button size="lg" className="w-full" disabled>
          <CreditCard className="w-5 h-5 mr-2" />
          Complete Payment (Check Email for Link)
        </Button>
      );
    }
    
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
    
    return (
      <Button size="lg" className="w-full" variant="outline">
        <LayoutDashboard className="w-5 h-5 mr-2" />
        View Dashboard
      </Button>
    );
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
              <CardTitle>No Profile Found</CardTitle>
              <CardDescription>
                Your account doesn't have a client profile yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to Home
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
          className="max-w-3xl mx-auto space-y-6"
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

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Complete all steps to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Progress value={getProgress()} className="h-3" />
              
              <div className="space-y-4">
                {/* Step 1: Account Created */}
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Step 2: Payment */}
                <div className="flex items-center gap-3">
                  {profile.subscriptionStatus === "active" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Payment Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.subscriptionStatus === "active" 
                        ? `${profile.plan?.replace("_", " ") || "Plan"} subscription active`
                        : "Awaiting payment via Stripe"}
                    </p>
                  </div>
                </div>

                {/* Step 3: Contract */}
                <div className="flex items-center gap-3">
                  {profile.contractStatus === "signed" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Contract Signed</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.contractStatus === "signed" && profile.contractSignedAt
                        ? `Signed on ${new Date(profile.contractSignedAt).toLocaleDateString()}`
                        : "Service agreement pending"}
                    </p>
                  </div>
                </div>

                {/* Step 4: Onboarding */}
                <div className="flex items-center gap-3">
                  {profile.onboardingStatus === "completed" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Onboarding Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.onboardingStatus === "completed"
                        ? "All set up and ready to go!"
                        : profile.onboardingStatus === "in_progress"
                        ? "In progress..."
                        : "Complete your profile and preferences"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary CTA */}
          <Card>
            <CardContent className="pt-6">
              {getPrimaryCTA()}
            </CardContent>
          </Card>

          {/* Plan Info */}
          {profile.plan && (
            <Card>
              <CardHeader>
                <CardTitle>Your Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold capitalize">
                      {profile.plan === "custom" 
                        ? `Custom Plan ($${profile.customPrice}/mo)`
                        : `${profile.plan.replace("_", " ")} Plan`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Up to {profile.maxServices} service{profile.maxServices > 1 ? "s" : ""}
                    </p>
                  </div>
                  {profile.selectedServices.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Selected Services</p>
                      <p className="font-medium">{profile.selectedServices.length}/{profile.maxServices}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientDashboard;