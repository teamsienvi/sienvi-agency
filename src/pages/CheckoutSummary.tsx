import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Check, Package, Megaphone, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  onboardingServices,
  planDisplayNames,
} from "@/data/onboardingServices";
import { advertisingChannels } from "@/components/advertising/advertisingData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [expandedChannels, setExpandedChannels] = useState<string[]>([]);
  
  const plan = searchParams.get("plan") || "single";
  const serviceId = searchParams.get("service");
  const isAdvertisingOnly = plan === "advertising";
  const planName = isAdvertisingOnly ? "Advertising Package" : (planDisplayNames[plan] || "Single Service");
  const priceId = PLAN_PRICE_IDS[plan];
  
  // Get the selected service (for single automation plan)
  const selectedService = onboardingServices.find(s => s.id === serviceId);
  
  // For single plan, use the service from URL
  const selectedServices = serviceId && plan === "single" ? [serviceId] : [];

  useEffect(() => {
    // Validate plan (allow advertising)
    if (!PLAN_PRICE_IDS[plan] && plan !== "advertising") {
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
    
    // Load advertising channels from session (if any pre-selected)
    const storedAdChannels = sessionStorage.getItem('selectedAdvertisingChannels');
    if (storedAdChannels) {
      try {
        const channels = JSON.parse(storedAdChannels);
        setSelectedAdChannels(channels);
      } catch (e) {
        console.error('Failed to parse advertising channels:', e);
      }
    }
  }, [plan, serviceId, selectedService, navigate]);

  const toggleChannel = (channelId: string) => {
    setSelectedAdChannels(prev => {
      const newChannels = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      sessionStorage.setItem('selectedAdvertisingChannels', JSON.stringify(newChannels));
      return newChannels;
    });
  };

  const toggleExpandChannel = (channelId: string) => {
    setExpandedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const selectAllChannels = () => {
    const allIds = advertisingChannels.map(c => c.id);
    setSelectedAdChannels(allIds);
    sessionStorage.setItem('selectedAdvertisingChannels', JSON.stringify(allIds));
  };

  const clearAllChannels = () => {
    setSelectedAdChannels([]);
    sessionStorage.setItem('selectedAdvertisingChannels', JSON.stringify([]));
  };

  const handleProceedToCheckout = async () => {
    // Validate before checkout
    if (isAdvertisingOnly && selectedAdChannels.length === 0) {
      toast.error("Please select at least one advertising channel");
      return;
    }
    
    setIsLoading(true);
    try {
      // Store selections for after checkout
      sessionStorage.setItem("pending_services", JSON.stringify(selectedServices));
      sessionStorage.setItem("pending_plan", plan);
      sessionStorage.setItem("pending_ad_channels", JSON.stringify(selectedAdChannels));

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          priceId: isAdvertisingOnly ? null : priceId,
          selectedServices,
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

  // Calculate totals
  const automationPrice = isAdvertisingOnly ? 0 : (PLAN_PRICES[plan] || PRICE_PER_SERVICE);
  const totalPrice = automationPrice + adChannelsCost;

  // Early return if invalid state
  if (!isAdvertisingOnly && plan === "single" && !selectedService) {
    return null;
  }

  const backLink = isAdvertisingOnly ? "/#services" : "/#services";
  const backLabel = "Back to Services";

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
              onClick={() => navigate(backLink)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Button>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              {isAdvertisingOnly ? (
                <Megaphone className="w-4 h-4" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              <span>{planName}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isAdvertisingOnly ? "Select Your Advertising Channels" : "Order Summary"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {isAdvertisingOnly 
                ? "Choose the platforms you want us to manage. Select 3+ channels for bundle pricing."
                : "Review your selection and proceed to checkout."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Channel Selection (for advertising) */}
            {isAdvertisingOnly && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="lg:col-span-2"
              >
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Available Channels</h2>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={selectAllChannels}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      {selectedAdChannels.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={clearAllChannels}
                          className="text-xs text-muted-foreground"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {advertisingChannels.map((channel) => {
                      const isSelected = selectedAdChannels.includes(channel.id);
                      const isExpanded = expandedChannels.includes(channel.id);
                      
                      return (
                        <Collapsible key={channel.id} open={isExpanded}>
                          <div 
                            className={`rounded-xl border transition-all ${
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "border-border bg-card hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-4 p-4">
                              <Checkbox
                                id={channel.id}
                                checked={isSelected}
                                onCheckedChange={() => toggleChannel(channel.id)}
                                className="h-5 w-5"
                              />
                              <div className="flex-1 min-w-0">
                                <label 
                                  htmlFor={channel.id}
                                  className="font-medium text-foreground cursor-pointer block"
                                >
                                  {channel.name}
                                </label>
                                <p className="text-sm text-muted-foreground truncate">
                                  {channel.shortDescription}
                                </p>
                              </div>
                              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                                ${PRICE_PER_CHANNEL}/mo
                              </span>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandChannel(channel.id)}
                                  className="p-1 h-auto"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            
                            <CollapsibleContent>
                              <div className="px-4 pb-4 pt-2 border-t border-border/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {channel.sections.map((section, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground">{section.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>

                  {/* Bundle discount notice */}
                  <AnimatePresence>
                    {hasAdSavings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                      >
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <Sparkles className="w-5 h-5" />
                          <span className="font-medium">
                            Bundle discount applied! You save ${adSavings.toLocaleString()}/mo
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!hasAdSavings && selectedAdChannels.length > 0 && (
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      Select {AD_BUNDLE_THRESHOLD - selectedAdChannels.length} more channel{AD_BUNDLE_THRESHOLD - selectedAdChannels.length !== 1 ? 's' : ''} to unlock bundle pricing
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Order Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`${isAdvertisingOnly ? "lg:col-span-1" : "lg:col-span-3 max-w-2xl mx-auto w-full"}`}
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-semibold text-foreground mb-6">Order Summary</h2>

                {/* Selected Service (for automation plans) */}
                {!isAdvertisingOnly && selectedService && (
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

                {/* Pricing Breakdown */}
                <div className="space-y-3 mb-6">
                  {/* Automation service line item */}
                  {!isAdvertisingOnly && selectedService && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{selectedService.title}</span>
                      <span className="text-foreground">
                        ${selectedService.isPremium ? PRICE_PREMIUM_SERVICE.toLocaleString() : PRICE_PER_SERVICE}/mo
                      </span>
                    </div>
                  )}
                  
                  {/* Advertising channels */}
                  {selectedAdChannels.length > 0 && (
                    <>
                      {getSelectedAdChannelNames().map((name, index) => (
                        <div key={selectedAdChannels[index]} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground">${PRICE_PER_CHANNEL}/mo</span>
                        </div>
                      ))}
                      
                      {/* Bundle discount */}
                      {hasAdSavings && (
                        <div className="flex justify-between text-sm text-green-600 pt-2 border-t border-border/50">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Bundle Discount
                          </span>
                          <span>-${adSavings.toLocaleString()}/mo</span>
                        </div>
                      )}
                    </>
                  )}

                  {isAdvertisingOnly && selectedAdChannels.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select channels to see pricing
                    </p>
                  )}
                </div>
                
                {/* Total */}
                {(selectedAdChannels.length > 0 || !isAdvertisingOnly) && (
                  <div className="flex justify-between items-baseline pt-4 border-t border-border mb-6">
                    <span className="font-semibold text-foreground">Monthly Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">
                        ${totalPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </div>
                )}

                {/* Proceed to checkout button */}
                <Button
                  size="lg"
                  onClick={handleProceedToCheckout}
                  disabled={isLoading || (isAdvertisingOnly && selectedAdChannels.length === 0)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold rounded-xl shadow-lg"
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
                
                <p className="text-muted-foreground text-xs text-center mt-4">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutSummary;
