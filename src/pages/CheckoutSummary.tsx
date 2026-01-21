import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Check, Package, Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  onboardingServices,
  planDisplayNames,
  getAvailableServicesForPlan,
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

// Pricing constants
const PRICE_PER_SERVICE = 888;
const PRICE_PREMIUM_SERVICE = 2450;
const PRICE_PER_CHANNEL = 888;
const ALL_CHANNELS_PRICE = 3450;
const TOTAL_CHANNELS = 7;
const AD_BUNDLE_THRESHOLD = 3;
const PRICE_PER_CHANNEL_BUNDLED = ALL_CHANNELS_PRICE / TOTAL_CHANNELS;

// Plan pricing
const PLAN_PRICES: Record<string, number> = {
  single: 888,
  triple: 2664,
  full: 3996,
};

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAdChannels, setSelectedAdChannels] = useState<string[]>([]);
  
  const plan = searchParams.get("plan") || "single";
  const serviceId = searchParams.get("service");
  const planName = planDisplayNames[plan] || "Single Service";
  const priceId = PLAN_PRICE_IDS[plan];
  
  // Get the selected service
  const selectedService = onboardingServices.find(s => s.id === serviceId);
  const availableServices = getAvailableServicesForPlan(plan);
  
  // For single plan, use the service from URL; for other plans, load from session
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (serviceId && plan === "single") {
      return [serviceId];
    }
    return [];
  });

  useEffect(() => {
    // Validate plan
    if (!PLAN_PRICE_IDS[plan]) {
      toast.error("Invalid plan selected");
      navigate("/#pricing");
      return;
    }
    
    // Validate service for single plan
    if (plan === "single" && !selectedService) {
      toast.error("Invalid service selected");
      navigate("/#services");
      return;
    }
    
    // Check if service is premium (not allowed for single plan)
    if (plan === "single" && selectedService?.isPremium) {
      toast.error("Premium services require the Full Automation plan");
      navigate("/#pricing");
      return;
    }
    
    // Load advertising channels from session
    const storedAdChannels = sessionStorage.getItem('selectedAdvertisingChannels');
    if (storedAdChannels) {
      try {
        setSelectedAdChannels(JSON.parse(storedAdChannels));
      } catch (e) {
        console.error('Failed to parse advertising channels:', e);
      }
    }
  }, [plan, serviceId, selectedService, navigate]);

  const handleProceedToCheckout = async () => {
    setIsLoading(true);
    try {
      // Store selections for after checkout
      sessionStorage.setItem("pending_services", JSON.stringify(selectedServices));
      sessionStorage.setItem("pending_plan", plan);
      sessionStorage.setItem("pending_ad_channels", JSON.stringify(selectedAdChannels));

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          priceId,
          selectedServices,
          advertisingChannels: selectedAdChannels,
          plan,
          isAdvertisingOnly: false,
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

  // Calculate advertising costs
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

  const planPrice = PLAN_PRICES[plan] || PRICE_PER_SERVICE;
  const totalPrice = planPrice + adChannelsCost;

  if (!selectedService && plan === "single") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-20">
        <div className="container-custom max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/#services")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Package className="w-4 h-4" />
              <span>{planName}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Order Summary
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Review your selection and proceed to checkout.
            </p>
          </motion.div>

          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm"
          >
            {/* Selected Service */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Your Selection</h2>
            </div>

            {selectedService && (
              <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <selectedService.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{selectedService.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                </div>
              </div>
            )}

            {/* Order Summary Details */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Pricing Breakdown</h3>
              
              <div className="space-y-3">
                {/* Service line item */}
                {selectedService && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{selectedService.title}</span>
                    <span className="text-foreground">
                      ${selectedService.isPremium ? PRICE_PREMIUM_SERVICE.toLocaleString() : PRICE_PER_SERVICE}/mo
                    </span>
                  </div>
                )}
                
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
                    
                    {/* Subtotal for ads */}
                    <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">
                        Advertising Subtotal ({adChannelsCount} channel{adChannelsCount !== 1 ? 's' : ''})
                      </span>
                      <span className="text-foreground">${adChannelsBaseTotal.toLocaleString()}/mo</span>
                    </div>
                    
                    {/* Bundle discount for advertising */}
                    {hasAdSavings && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Bundle Discount (3+ channels)
                        </span>
                        <span>-${adSavings.toLocaleString()}/mo</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Total */}
                <div className="flex justify-between items-baseline pt-4 border-t border-border">
                  <span className="font-semibold text-foreground">Monthly Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">
                      ${totalPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Proceed to checkout button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
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
                  Proceed to Payment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-muted-foreground text-sm text-center">
              Secure checkout powered by Stripe
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutSummary;
