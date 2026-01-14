import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ServiceCheckbox from "@/components/onboarding/ServiceCheckbox";
import {
  onboardingServices,
  planLimits,
  planDisplayNames,
} from "@/data/onboardingServices";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Price ID mapping (Test Mode)
const PLAN_PRICE_IDS: Record<string, string> = {
  single: "price_1SpbnaDnw1azoLSpAmnnUwMX",
  triple: "price_1Spbo0Dnw1azoLSpUgAdICKR",
  full: "price_1SpboRDnw1azoLSpG07N2lA0",
};

const SelectServices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const plan = searchParams.get("plan") || "single";
  const maxServices = planLimits[plan] || 1;
  const planName = planDisplayNames[plan] || "Single Service";
  const priceId = PLAN_PRICE_IDS[plan];

  useEffect(() => {
    // Validate plan parameter
    if (!PLAN_PRICE_IDS[plan]) {
      toast.error("Invalid plan selected");
      navigate("/#pricing");
    }
  }, [plan, navigate]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      }

      if (prev.length >= maxServices) {
        toast.error(`Your ${planName} plan allows up to ${maxServices} service${maxServices > 1 ? "s" : ""}.`);
        return prev;
      }

      return [...prev, serviceId];
    });
  };

  const handleProceedToCheckout = async () => {
    if (selectedServices.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    setIsLoading(true);
    try {
      // Store selected services in session storage for after checkout
      sessionStorage.setItem("pending_services", JSON.stringify(selectedServices));
      sessionStorage.setItem("pending_plan", plan);

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          priceId,
          selectedServices,
          plan,
        },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to start checkout. Please try again.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("No checkout URL received. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Button
              variant="ghost"
              onClick={() => navigate("/#pricing")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Button>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{planName} Plan</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Services
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Select the services you'd like included in your plan. 
              You can choose up to <span className="font-semibold text-primary">{maxServices} service{maxServices > 1 ? "s" : ""}</span>.
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

          {/* Proceed to checkout button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              size="lg"
              onClick={handleProceedToCheckout}
              disabled={selectedServices.length === 0 || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-xl shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {selectedServices.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Please select at least one service to continue
              </p>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SelectServices;
