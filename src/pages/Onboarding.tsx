import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Target,
  User,
  ClipboardList,
  Lock,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Megaphone,
  Briefcase,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GoalSheetForm } from "@/components/onboarding/GoalSheetForm";
import { AvatarProfileForm } from "@/components/onboarding/AvatarProfileForm";
import { QuestionnaireForm } from "@/components/onboarding/QuestionnaireForm";
import { AmazonOnboardingForm } from "@/components/onboarding/AmazonOnboardingForm";
import { AdvertisingOnboardingForm } from "@/components/onboarding/AdvertisingOnboardingForm";
import { BusinessAdminOnboardingForm } from "@/components/onboarding/BusinessAdminOnboardingForm";

interface StepData {
  goals: any;
  avatars: any;
  questionnaire: any;
  amazon: any;
  advertising: any;
}

type OnboardingType = "standard" | "amazon" | "advertising" | "discovery";

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepData, setStepData] = useState<StepData>({ goals: null, avatars: null, questionnaire: null, amazon: null, advertising: null });
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [onboardingType, setOnboardingType] = useState<OnboardingType>("standard");
  const [totalSteps, setTotalSteps] = useState(3);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  const checkAccessAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      const response = await supabase.functions.invoke("get-client-profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error || response.data.error) {
        navigate("/dashboard");
        return;
      }

      const profile = response.data.profile;
      
      if (profile.contractStatus !== "signed") {
        toast.error("Please sign the contract first");
        navigate("/dashboard");
        return;
      }

      if (profile.onboardingStatus === "completed") {
        toast.info("Onboarding already completed!");
        navigate("/dashboard");
        return;
      }

      setClientProfileId(profile.id);
      setSelectedServices(profile.selectedServices || []);

      // Determine onboarding type based on selected services
      const services = profile.selectedServices || [];
      let type: OnboardingType = "standard";
      let numSteps = 3;
      
      if (services.includes("custom-tool")) {
        type = "discovery";
        numSteps = 1;
      } else if (services.includes("amazon-design")) {
        type = "amazon";
        numSteps = 1; // Amazon only has 1 step - the Amazon questionnaire
      } else if (services.includes("advertising-package") || services.some((s: string) => s.startsWith("advertising"))) {
        type = "advertising";
      }
      setOnboardingType(type);
      setTotalSteps(numSteps);

      // Load existing onboarding data based on type
      const [goalsRes, avatarsRes, questionnaireRes, amazonRes, advertisingRes] = await Promise.all([
        supabase.from("onboarding_goals").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabase.from("onboarding_avatars").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabase.from("onboarding_questionnaire").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabase.from("onboarding_amazon").select("*").eq("client_profile_id", profile.id).maybeSingle(),
        supabase.from("onboarding_advertising").select("*").eq("client_profile_id", profile.id).maybeSingle(),
      ]);

      // Determine completed steps based on onboarding type
      let completed: boolean[];
      if (type === "discovery") {
        completed = [false];
      } else if (type === "amazon") {
        // Amazon only has 1 step
        completed = [!!amazonRes.data?.completed_at];
      } else if (type === "advertising") {
        completed = [
          !!goalsRes.data?.completed_at,
          !!avatarsRes.data?.completed_at,
          !!advertisingRes.data?.completed_at,
        ];
      } else {
        completed = [
          !!goalsRes.data?.completed_at,
          !!avatarsRes.data?.completed_at,
          !!questionnaireRes.data?.completed_at,
        ];
      }
      
      setCompletedSteps(completed);
      setStepData({
        goals: goalsRes.data,
        avatars: avatarsRes.data,
        questionnaire: questionnaireRes.data,
        amazon: amazonRes.data,
        advertising: advertisingRes.data,
      });

      const firstIncomplete = completed.findIndex(c => !c);
      setCurrentStep(firstIncomplete === -1 ? 0 : firstIncomplete);

      if (profile.onboardingStatus === "not_started") {
        await supabase.functions.invoke("update-client-status", {
          body: { action: "start_onboarding" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepIndex: number) => {
    const newCompleted = [...completedSteps];
    newCompleted[stepIndex] = true;
    setCompletedSteps(newCompleted);

    if (newCompleted.every(c => c)) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke("update-client-status", {
          body: { action: "complete_onboarding" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      toast.success("Onboarding completed!");
      navigate("/dashboard");
    } else if (stepIndex < totalSteps - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const getSteps = () => {
    if (onboardingType === "discovery") {
      return [{ id: "discovery-questionnaire", title: "Business Admin Questionnaire", icon: <Briefcase className="w-6 h-6" /> }];
    }
    // Amazon Design only has 1 step - the Amazon questionnaire
    if (onboardingType === "amazon") {
      return [{ id: "amazon-questionnaire", title: "Amazon Questionnaire", icon: <ShoppingBag className="w-6 h-6" /> }];
    }

    const baseSteps = [
      { id: "goal-sheet", title: "Goal Sheet", icon: <Target className="w-6 h-6" /> },
      { id: "avatar-profile", title: "Avatar Profile", icon: <User className="w-6 h-6" /> },
    ];

    if (onboardingType === "advertising") {
      return [...baseSteps, { id: "advertising-questionnaire", title: "Advertising Questionnaire", icon: <Megaphone className="w-6 h-6" /> }];
    }
    return [...baseSteps, { id: "questionnaire", title: "Questionnaire", icon: <ClipboardList className="w-6 h-6" /> }];
  };

  const steps = getSteps();

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Badge className="bg-primary">Onboarding</Badge>
            <h1 className="text-3xl font-bold">Complete Your Onboarding</h1>
            <p className="text-muted-foreground">Step {currentStep + 1} of {totalSteps}</p>
          </div>

          <div className="flex justify-center gap-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => (completedSteps[index] || index <= completedSteps.filter(Boolean).length) && setCurrentStep(index)}
                disabled={index > completedSteps.filter(Boolean).length}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentStep === index
                    ? "bg-primary text-primary-foreground"
                    : completedSteps[index]
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                } ${index > completedSteps.filter(Boolean).length ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
              >
                {completedSteps[index] ? <CheckCircle2 className="w-5 h-5" /> : index > completedSteps.filter(Boolean).length ? <Lock className="w-5 h-5" /> : step.icon}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>

          {clientProfileId && (
            <div className="mt-8">
              {/* Discovery Questionnaire has only 1 step */}
              {onboardingType === "discovery" && currentStep === 0 && (
                <BusinessAdminOnboardingForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(0)}
                  initialData={stepData.questionnaire}
                />
              )}

              {/* Amazon Design has only 1 step - the Amazon questionnaire */}
              {onboardingType === "amazon" && currentStep === 0 && (
                <AmazonOnboardingForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(0)}
                  initialData={stepData.amazon}
                />
              )}
              
              {/* Standard and Advertising flows have 3 steps */}
              {onboardingType !== "amazon" && onboardingType !== "discovery" && currentStep === 0 && (
                <GoalSheetForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(0)}
                  initialData={stepData.goals}
                />
              )}
              {onboardingType !== "amazon" && onboardingType !== "discovery" && currentStep === 1 && (
                <AvatarProfileForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(1)}
                  initialData={stepData.avatars}
                />
              )}
              {currentStep === 2 && onboardingType === "advertising" && (
                <AdvertisingOnboardingForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(2)}
                  initialData={stepData.advertising}
                  selectedChannels={selectedServices.filter(s => s.startsWith("channel-"))}
                />
              )}
              {currentStep === 2 && onboardingType === "standard" && (
                <QuestionnaireForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(2)}
                  initialData={stepData.questionnaire}
                />
              )}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Onboarding;
