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

// Advertising pricing constants
const PRICE_PER_CHANNEL = 888;
const TOTAL_CHANNELS = 7;
const ALL_CHANNELS_PRICE = 3450;
const AD_BUNDLE_THRESHOLD = 3;

// Automation service pricing
const PRICE_PER_SERVICE = 888;
const PRICE_PREMIUM_SERVICE = 2450;
const FULL_PLAN_PRICE = 3996;

// Plan pricing
const PLAN_PRICES: Record<string, number> = {
  single: 888,
  triple: 2664,
  full: 3996,
};
const PRICE_PER_CHANNEL_BUNDLED = ALL_CHANNELS_PRICE / TOTAL_CHANNELS;

const SelectServices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAdChannels, setSelectedAdChannels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const plan = searchParams.get("plan") || "single";
  const isAdvertisingOnly = plan === "advertising";
  const maxServices = planLimits[plan] || 1;
  const planName = isAdvertisingOnly ? "Advertising Package" : (planDisplayNames[plan] || "Single Service");
  const priceId = PLAN_PRICE_IDS[plan];
  const isFullPlan = plan === "full";
  
  // Get available services based on plan
  const availableServices = getAvailableServicesForPlan(plan);

  useEffect(() => {
    // Validate plan parameter (allow advertising)
    if (!PLAN_PRICE_IDS[plan] && plan !== "advertising") {
      toast.error("Invalid plan selected");
      navigate("/#pricing");
    }
    
    // For full plan, pre-select all services
    if (isFullPlan) {
      setSelectedServices(getFullAutomationServiceIds());
    }

    // Load preselected service from session storage (from service card "Get Started")
    const preselectedService = sessionStorage.getItem("preselected_service");
    if (preselectedService && !isFullPlan && !isAdvertisingOnly) {
      setSelectedServices([preselectedService]);
      sessionStorage.removeItem("preselected_service");
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
  }, [plan, navigate, isFullPlan, isAdvertisingOnly]);

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
    
    // For advertising-only, we need at least one ad channel
    if (isAdvertisingOnly && selectedAdChannels.length === 0) {
      toast.error("Please select at least one advertising channel");
      return;
    }
    
    // For other plans, we need at least one service (unless advertising-only)
    if (!isAdvertisingOnly && servicesToCheckout.length === 0) {
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
          priceId: isAdvertisingOnly ? null : priceId,
          selectedServices: servicesToCheckout,
          advertisingChannels: selectedAdChannels,
          plan,
          isAdvertisingOnly,
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

  // Calculate advertising costs with new bundle pricing
  // All 7 channels = $3,450, 3+ channels = proportional bundle rate
  const adChannelsCount = selectedAdChannels.length;
  const adChannelsBaseTotal = adChannelsCount * PRICE_PER_CHANNEL;
  const hasAdSavings = adChannelsCount >= AD_BUNDLE_THRESHOLD;
  const adChannelsCost = hasAdSavings 
    ? Math.round(adChannelsCount * PRICE_PER_CHANNEL_BUNDLED) 
    : adChannelsBaseTotal;
  const adSavings = hasAdSavings ? adChannelsBaseTotal - adChannelsCost : 0;
  
  const getSelectedAdChannelNames = () => {
    return selectedAdChannels.map(id => 
      advertisingChannels.find(c => c.id === id)?.name || id
    );
  };

  // Advertising-only checkout
  if (isAdvertisingOnly) {
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
                onClick={() => navigate("/#advertising")}
                className="mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Advertising
              </Button>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Megaphone className="w-4 h-4" />
                <span>Advertising Package</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Confirm Your Advertising Channels
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Review your selected advertising channels and proceed to checkout.
              </p>
            </motion.div>

            {/* Selected channels card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Selected Channels</h2>
              </div>
              
              {selectedAdChannels.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No channels selected. Go back to select advertising channels.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-6">
                  {getSelectedAdChannelNames().map((name, index) => (
                    <motion.div
                      key={selectedAdChannels[index]}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm border border-primary/20"
                    >
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium">{name}</span>
                      <button
                        onClick={() => handleRemoveAdChannel(selectedAdChannels[index])}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              {selectedAdChannels.length > 0 && (
                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Order Summary</h3>
                  
                  <div className="space-y-3">
                    {/* Line items */}
                    {getSelectedAdChannelNames().map((name, index) => (
                      <div key={selectedAdChannels[index]} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="text-foreground">${PRICE_PER_CHANNEL}/mo</span>
                      </div>
                    ))}
                    
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Subtotal ({adChannelsCount} channel{adChannelsCount !== 1 ? 's' : ''})</span>
                      <span className="text-foreground">${adChannelsBaseTotal.toLocaleString()}/mo</span>
                    </div>
                    
                    {/* Bundle discount */}
                    {hasAdSavings && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Bundle Discount (3+ channels)
                        </span>
                        <span>-${adSavings.toLocaleString()}/mo</span>
                      </div>
                    )}
                    
                    {/* Total */}
                    <div className="flex justify-between items-baseline pt-3 border-t border-border">
                      <span className="font-semibold text-foreground">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-foreground">
                          ${adChannelsCost.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                disabled={selectedAdChannels.length === 0 || isLoading}
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
              
              {selectedAdChannels.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Please select at least one channel to continue
                </p>
              )}
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

              {/* Order Summary */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  {/* Line items */}
                  {onboardingServices.map((service) => (
                    <div key={service.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{service.title}</span>
                      <span className="text-foreground">
                        ${service.isPremium ? PRICE_PREMIUM_SERVICE.toLocaleString() : PRICE_PER_SERVICE}/mo
                      </span>
                    </div>
                  ))}
                  
                  {/* Plan total */}
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Full Suite (6 services)</span>
                    <span className="text-foreground">${FULL_PLAN_PRICE.toLocaleString()}/mo</span>
                  </div>
                  
                  {/* Advertising add-on if selected */}
                  {selectedAdChannels.length > 0 && (
                    <>
                      <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">
                          Advertising ({adChannelsCount} channel{adChannelsCount !== 1 ? 's' : ''})
                        </span>
                        <span className="text-foreground">+${adChannelsCost.toLocaleString()}/mo</span>
                      </div>
                    </>
                  )}
                  
                  {/* Total */}
                  <div className="flex justify-between items-baseline pt-3 border-t border-border">
                    <span className="font-semibold text-foreground">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">
                        ${(FULL_PLAN_PRICE + adChannelsCost).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </div>
                </div>
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

          {/* Order Summary */}
          {selectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm max-w-2xl mx-auto"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                {/* Selected services line items */}
                {selectedServices.map((serviceId) => {
                  const service = availableServices.find(s => s.id === serviceId);
                  if (!service) return null;
                  return (
                    <div key={serviceId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{service.title}</span>
                      <span className="text-foreground">
                        ${service.isPremium ? PRICE_PREMIUM_SERVICE.toLocaleString() : PRICE_PER_SERVICE}/mo
                      </span>
                    </div>
                  );
                })}
                
                {/* Advertising channels if selected */}
                {selectedAdChannels.length > 0 && (
                  <>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Megaphone className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Advertising Channels</span>
                      </div>
                      {getSelectedAdChannelNames().map((name, index) => (
                        <div key={selectedAdChannels[index]} className="flex justify-between text-sm pl-6">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground">${PRICE_PER_CHANNEL}/mo</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Bundle discount for advertising */}
                    {hasAdSavings && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Ad Bundle Discount (3+ channels)
                        </span>
                        <span>-${adSavings.toLocaleString()}/mo</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Subtotal */}
                <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">
                    Automation ({selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''})
                  </span>
                  <span className="text-foreground">${PLAN_PRICES[plan]?.toLocaleString()}/mo</span>
                </div>
                
                {selectedAdChannels.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Advertising ({adChannelsCount} channel{adChannelsCount !== 1 ? 's' : ''})
                    </span>
                    <span className="text-foreground">+${adChannelsCost.toLocaleString()}/mo</span>
                  </div>
                )}
                
                {/* Total */}
                <div className="flex justify-between items-baseline pt-3 border-t border-border">
                  <span className="font-semibold text-foreground">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">
                      ${((PLAN_PRICES[plan] || 0) + adChannelsCost).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
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
