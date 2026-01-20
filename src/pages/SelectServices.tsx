import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Sparkles, ArrowLeft, Check, Package, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ServiceCheckbox from "@/components/onboarding/ServiceCheckbox";
import {
  onboardingServices,
  planLimits,
  planDisplayNames,
  getAvailableServicesForPlan,
  getFullAutomationServiceIds,
} from "@/data/onboardingServices";
import { advertisingChannels } from "@/components/advertising/advertisingData";
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
  const [selectedAdChannels, setSelectedAdChannels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const plan = searchParams.get("plan") || "single";
  const maxServices = planLimits[plan] || 1;
  const planName = planDisplayNames[plan] || "Single Service";
  const priceId = PLAN_PRICE_IDS[plan];
  const isFullPlan = plan === "full";
  
  // Get available services based on plan
  const availableServices = getAvailableServicesForPlan(plan);

  useEffect(() => {
    // Validate plan parameter
    if (!PLAN_PRICE_IDS[plan]) {
      toast.error("Invalid plan selected");
      navigate("/#pricing");
    }
    
    // For full plan, pre-select all services
    if (isFullPlan) {
      setSelectedServices(getFullAutomationServiceIds());
    }
    
    // Load any selected advertising channels from sessionStorage
    const storedAdChannels = sessionStorage.getItem('selectedAdvertisingChannels');
    if (storedAdChannels) {
      try {
        const channels = JSON.parse(storedAdChannels);
        setSelectedAdChannels(channels);
      } catch (e) {
        console.error('Failed to parse advertising channels:', e);
      }
    }
  }, [plan, navigate, isFullPlan]);

  const handleRemoveAdChannel = (channelId: string) => {
    setSelectedAdChannels(prev => prev.filter(id => id !== channelId));
    // Update sessionStorage
    const updatedChannels = selectedAdChannels.filter(id => id !== channelId);
    sessionStorage.setItem('selectedAdvertisingChannels', JSON.stringify(updatedChannels));
  };

  const handleToggleService = (serviceId: string) => {
    // Don't allow toggling for full plan
    if (isFullPlan) return;
    
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
    const servicesToCheckout = isFullPlan ? getFullAutomationServiceIds() : selectedServices;
    
    if (servicesToCheckout.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    setIsLoading(true);
    try {
      // Store selected services in session storage for after checkout
      sessionStorage.setItem("pending_services", JSON.stringify(servicesToCheckout));
      sessionStorage.setItem("pending_plan", plan);
      sessionStorage.setItem("pending_ad_channels", JSON.stringify(selectedAdChannels));

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          priceId,
          selectedServices: servicesToCheckout,
          advertisingChannels: selectedAdChannels,
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

  // Calculate total for display
  const adChannelsCost = selectedAdChannels.length * 888;
  const getSelectedAdChannelNames = () => {
    return selectedAdChannels.map(id => 
      advertisingChannels.find(c => c.id === id)?.name || id
    );
  };

  // Full Automation plan - show all services with confirmation
  if (isFullPlan) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 py-12 md:py-20">
          <div className="container-custom max-w-4xl">
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
                <Package className="w-4 h-4" />
                <span>{planName}</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Complete Automation Suite
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Your plan includes access to <span className="font-semibold text-primary">all 6 core services</span>. 
                Review your package below and proceed to checkout.
              </p>
            </motion.div>

            {/* All services included card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Included Services</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onboardingServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <service.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Advertising Channels Bundle (if any selected) */}
            {selectedAdChannels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Advertising Add-ons</h2>
                    <p className="text-sm text-muted-foreground">
                      +${adChannelsCost.toLocaleString()}/month
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {getSelectedAdChannelNames().map((name, index) => (
                    <motion.div
                      key={selectedAdChannels[index]}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm"
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => handleRemoveAdChannel(selectedAdChannels[index])}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

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
                disabled={isLoading}
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
              
              <p className="text-muted-foreground text-sm">
                $3,996.00/month • All 6 services included
                {selectedAdChannels.length > 0 && (
                  <span> + ${adChannelsCost.toLocaleString()}/month advertising</span>
                )}
              </p>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Single/Triple plans - show selectable services (excluding premium)
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

          {/* Services grid - only showing available (non-premium) services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12"
          >
            {availableServices.map((service, index) => (
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

          {/* Advertising Channels Bundle (if any selected) */}
          {selectedAdChannels.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-card border border-primary/20 rounded-2xl p-6 mb-8 shadow-sm max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Advertising Add-ons</h3>
                  <p className="text-sm text-muted-foreground">
                    +${adChannelsCost.toLocaleString()}/month
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {getSelectedAdChannelNames().map((name, index) => (
                  <div
                    key={selectedAdChannels[index]}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                  >
                    <span>{name}</span>
                    <button
                      onClick={() => handleRemoveAdChannel(selectedAdChannels[index])}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

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

            {selectedServices.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Please select at least one service to continue
              </p>
            ) : selectedAdChannels.length > 0 ? (
              <p className="text-muted-foreground text-sm">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} + {selectedAdChannels.length} advertising channel{selectedAdChannels.length !== 1 ? 's' : ''}
              </p>
            ) : null}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SelectServices;
