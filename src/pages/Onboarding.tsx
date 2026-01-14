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
import { GoalSheetForm } from "@/components/onboarding/GoalSheetForm";
import { AvatarProfileForm } from "@/components/onboarding/AvatarProfileForm";
import { QuestionnaireForm } from "@/components/onboarding/QuestionnaireForm";

interface StepData {
  goals: any;
  avatars: any;
  questionnaire: any;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepData, setStepData] = useState<StepData>({ goals: null, avatars: null, questionnaire: null });
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false]);

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

      // Load existing onboarding data
      const [goalsRes, avatarsRes, questionnaireRes] = await Promise.all([
        supabase.from("onboarding_goals").select("*").eq("client_profile_id", profile.id).single(),
        supabase.from("onboarding_avatars").select("*").eq("client_profile_id", profile.id).single(),
        supabase.from("onboarding_questionnaire").select("*").eq("client_profile_id", profile.id).single(),
      ]);

      const completed = [
        !!goalsRes.data?.completed_at,
        !!avatarsRes.data?.completed_at,
        !!questionnaireRes.data?.completed_at,
      ];
      
      setCompletedSteps(completed);
      setStepData({
        goals: goalsRes.data,
        avatars: avatarsRes.data,
        questionnaire: questionnaireRes.data,
      });

      // Set current step to first incomplete
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
      // All steps complete
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke("update-client-status", {
          body: { action: "complete_onboarding" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      toast.success("Onboarding completed!");
      navigate("/dashboard");
    } else if (stepIndex < 2) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const steps = [
    { id: "goal-sheet", title: "Goal Sheet", icon: <Target className="w-6 h-6" /> },
    { id: "avatar-profile", title: "Avatar Profile", icon: <User className="w-6 h-6" /> },
    { id: "questionnaire", title: "Questionnaire", icon: <ClipboardList className="w-6 h-6" /> },
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Badge className="bg-purple-500">Onboarding</Badge>
            <h1 className="text-3xl font-bold">Complete Your Onboarding</h1>
            <p className="text-muted-foreground">Step {currentStep + 1} of 3</p>
          </div>

          {/* Progress Steps */}
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

          {/* Form Content */}
          {clientProfileId && (
            <div className="mt-8">
              {currentStep === 0 && (
                <GoalSheetForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(0)}
                  initialData={stepData.goals}
                />
              )}
              {currentStep === 1 && (
                <AvatarProfileForm
                  clientProfileId={clientProfileId}
                  onComplete={() => handleStepComplete(1)}
                  initialData={stepData.avatars}
                />
              )}
              {currentStep === 2 && (
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
