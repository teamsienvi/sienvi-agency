import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ServiceCheckbox from "@/components/onboarding/ServiceCheckbox";
import {
  onboardingServices,
  planLimits,
  planDisplayNames,
} from "@/data/onboardingServices";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const OnboardingServices = () => {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<{
    plan: string;
    subscription_status: string;
    onboarding_completed: boolean;
    email: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      // Get subscription from URL params (passed from checkout) or session storage
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get("email") || sessionStorage.getItem("checkout_email");

      if (!email) {
        toast({
          title: "Session expired",
          description: "Please complete checkout again.",
          variant: "destructive",
        });
        navigate("/#pricing");
        return;
      }

      // Store email for potential page reloads
      sessionStorage.setItem("checkout_email", email);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, subscription_status, onboarding_completed, email, selected_services")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "No active subscription",
          description: "Please complete checkout first.",
          variant: "destructive",
        });
        navigate("/#pricing");
        return;
      }

      if (data.subscription_status !== "active") {
        toast({
          title: "Subscription not active",
          description: "Your subscription is not currently active.",
          variant: "destructive",
        });
        navigate("/#pricing");
        return;
      }

      if (data.onboarding_completed) {
        navigate("/success");
        return;
      }

      setSubscription(data);
      
      // Restore any previously selected services
      if (data.selected_services && data.selected_services.length > 0) {
        setSelectedServices(data.selected_services);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxServices = subscription?.plan ? planLimits[subscription.plan] || 1 : 1;

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      }

      if (prev.length >= maxServices) {
        toast({
          title: "Selection limit reached",
          description: `Your ${planDisplayNames[subscription?.plan || "single"]} plan allows up to ${maxServices} service${maxServices > 1 ? "s" : ""}.`,
          variant: "destructive",
        });
        return prev;
      }

      return [...prev, serviceId];
    });
  };

  const handleContinue = async () => {
    if (selectedServices.length === 0) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          selected_services: selectedServices,
          onboarding_completed: true,
        })
        .eq("email", subscription?.email);

      if (error) throw error;

      // Clear session storage
      sessionStorage.removeItem("checkout_email");

      toast({
        title: "Services selected!",
        description: "Your account is now being set up.",
      });

      navigate("/success");
    } catch (error) {
      console.error("Error saving services:", error);
      toast({
        title: "Error",
        description: "Failed to save your selections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-20">
        <div className="container-custom max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{planDisplayNames[subscription?.plan || "single"]} Plan</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Select Your Services
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the services you want us to activate for your account. 
              You can select up to <span className="font-semibold text-primary">{maxServices} service{maxServices > 1 ? "s" : ""}</span> with your plan.
            </p>
          </motion.div>

          {/* Selection counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card border border-border rounded-full shadow-sm">
              <span className="text-muted-foreground">Selected:</span>
              <span className="text-2xl font-bold text-primary">{selectedServices.length}</span>
              <span className="text-muted-foreground">of</span>
              <span className="text-2xl font-bold text-foreground">{maxServices}</span>
            </div>
          </motion.div>

          {/* Services grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12"
          >
            {onboardingServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <ServiceCheckbox
                  service={service}
                  isSelected={selectedServices.includes(service.id)}
                  isDisabled={
                    !selectedServices.includes(service.id) &&
                    selectedServices.length >= maxServices
                  }
                  onToggle={handleToggleService}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={selectedServices.length === 0 || isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-xl shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>

          {selectedServices.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground text-sm mt-4"
            >
              Please select at least one service to continue
            </motion.p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OnboardingServices;
