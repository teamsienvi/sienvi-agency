import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Target,
  User,
  ClipboardList,
  Lock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "locked" | "available" | "completed";
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<{
    contractStatus: string;
    onboardingStatus: string;
  } | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      const response = await supabase.functions.invoke("get-client-profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error || response.data.error) {
        navigate("/dashboard");
        return;
      }

      const profile = response.data.profile;
      
      // Check if contract is signed
      if (profile.contractStatus !== "signed") {
        toast.error("Please sign the contract first");
        navigate("/dashboard");
        return;
      }

      // Check if onboarding is already completed
      if (profile.onboardingStatus === "completed") {
        toast.info("Onboarding already completed!");
        navigate("/dashboard");
        return;
      }

      setProfileStatus({
        contractStatus: profile.contractStatus,
        onboardingStatus: profile.onboardingStatus,
      });

      // Start onboarding if not started
      if (profile.onboardingStatus === "not_started") {
        await supabase.functions.invoke("update-client-status", {
          body: { action: "start_onboarding" },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    } catch (error: any) {
      console.error("Error checking access:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: "goal-sheet",
      title: "Goal Sheet",
      description: "Tell us about your business goals and what success looks like for you.",
      icon: <Target className="w-6 h-6" />,
      status: "available",
    },
    {
      id: "avatar-profile",
      title: "Avatar Profile",
      description: "Help us understand your ideal customer and target audience.",
      icon: <User className="w-6 h-6" />,
      status: "locked",
    },
    {
      id: "questionnaire",
      title: "Onboarding Questionnaire",
      description: "Answer a few questions to help us customize your experience.",
      icon: <ClipboardList className="w-6 h-6" />,
      status: "locked",
    },
  ];

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Badge className="bg-purple-500">Onboarding</Badge>
            <h1 className="text-3xl font-bold">Complete Your Onboarding</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Complete these steps to help us deliver the best possible service for your business.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={step.status === "locked" ? "opacity-60" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        step.status === "completed" 
                          ? "bg-green-100 text-green-600"
                          : step.status === "available"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : step.status === "locked" ? (
                          <Lock className="w-6 h-6" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Step {index + 1}: {step.title}</h3>
                          {step.status === "completed" && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <div>
                        {step.status === "available" ? (
                          <Button disabled>
                            Coming Soon
                          </Button>
                        ) : step.status === "completed" ? (
                          <Button variant="outline" disabled>
                            View
                          </Button>
                        ) : (
                          <Button variant="ghost" disabled>
                            <Lock className="w-4 h-4 mr-2" />
                            Locked
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Info Box */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Coming Soon</CardTitle>
              <CardDescription>
                The onboarding forms are being built. You'll receive a notification when they're ready.
                For now, your account is set up and our team will reach out to you directly.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Skip Button */}
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Onboarding;