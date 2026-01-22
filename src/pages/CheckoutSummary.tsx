import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Check, Package, Megaphone, Sparkles, ChevronDown, ChevronUp, Plus } from "lucide-react";
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
const PRICE_AMAZON_DESIGN = 999;
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

// Service-specific pricing overrides
const SERVICE_PRICES: Record<string, number> = {
  "amazon-design": PRICE_AMAZON_DESIGN,
  "social-media-suite": PRICE_PREMIUM_SERVICE,
  "custom-lms": PRICE_PREMIUM_SERVICE,
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
    
    // Check if service is premium (not allowed for single plan - but amazon-design and special services are ok)
    if (plan === "single" && selectedService?.isPremium && !SERVICE_PRICES[serviceId || '']) {
      toast.error("Premium services require the Full Automation plan");
      navigate("/#pricing");
      return;
    }
    
    // For non-advertising plans, don't load stored advertising channels
    if (!isAdvertisingOnly) {
      setSelectedAdChannels([]);
      return;
    }
    
    // Load advertising channels from session (only for advertising plan)
    const storedAdChannels = sessionStorage.getItem('selectedAdvertisingChannels');
    if (storedAdChannels) {
      try {
        const channels = JSON.parse(storedAdChannels);
        setSelectedAdChannels(channels);
      } catch (e) {
        console.error('Failed to parse advertising channels:', e);
      }
    }
  }, [plan, serviceId, selectedService, navigate, isAdvertisingOnly]);

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

      // For single service purchases with specific service, use dynamic pricing (no priceId)
      // For bundle plans (triple, full), use the hardcoded priceId
      const useDynamicPricing = plan === "single" && serviceId && SERVICE_PRICES[serviceId];
      
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { 
          priceId: useDynamicPricing ? null : priceId,
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

  const handleBundleWithPlan = (bundlePlan: string) => {
    // Store advertising selections and navigate to plan selection with advertising
    sessionStorage.setItem('selectedAdvertisingChannels', JSON.stringify(selectedAdChannels));
    
    // Handle single plan add-ons (SEO/AEO or LMS)
    if (bundlePlan === 'single-seo') {
      sessionStorage.setItem('preselected_service', 'seo-aeo');
      navigate(`/select-services?plan=single&includeAds=true`);
    } else if (bundlePlan === 'single-lms') {
      sessionStorage.setItem('preselected_service', 'custom-lms');
      navigate(`/select-services?plan=single&includeAds=true`);
    } else {
      navigate(`/select-services?plan=${bundlePlan}&includeAds=true`);
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

  // Calculate totals - use service-specific price if available
  const getServicePrice = () => {
    if (isAdvertisingOnly) return 0;
    if (plan === "single" && serviceId && SERVICE_PRICES[serviceId]) {
      return SERVICE_PRICES[serviceId];
    }
    return PLAN_PRICES[plan] || PRICE_PER_SERVICE;
  };
  
  const automationPrice = getServicePrice();
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
        <div className="container-custom max-w-5xl">
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
                              <div className="px-6 pb-6 pt-4 border-t border-border/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {channel.sections.map((section, idx) => (
                                    <div key={idx}>
                                      <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide mb-3">
                                        {section.title}
                                      </h4>
                                      <ul className="space-y-2">
                                        {section.items.map((item, itemIdx) => (
                                          <li key={itemIdx} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                          </li>
                                        ))}
                                      </ul>
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
                        className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                      >
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
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
                {/* Channel count and price header for advertising */}
                {isAdvertisingOnly && (
                  <div className="mb-6">
                    <p className="text-primary text-sm font-medium mb-1">
                      {adChannelsCount} channel{adChannelsCount !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-foreground">
                        ${adChannelsCost.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    {hasAdSavings && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                        Save ${adSavings.toLocaleString()}/mo with bundle
                      </p>
                    )}
                  </div>
                )}

                {/* Select All Channels button */}
                {isAdvertisingOnly && selectedAdChannels.length < TOTAL_CHANNELS && (
                  <Button
                    variant="outline"
                    onClick={selectAllChannels}
                    className="w-full mb-4 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Select All Channels — ${ALL_CHANNELS_PRICE.toLocaleString()}/mo
                  </Button>
                )}

                {/* Selected Service (for automation plans) */}
                {!isAdvertisingOnly && selectedService && (
                  <>
                    <h2 className="text-xl font-semibold text-foreground mb-6">Order Summary</h2>
                    <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <selectedService.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{selectedService.title}</h3>
                        <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                      </div>
                    </div>
                    
                    {/* Total for non-advertising */}
                    <div className="flex justify-between items-baseline pt-4 border-t border-border mb-6">
                      <span className="font-semibold text-foreground">Monthly Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-foreground">
                          ${totalPrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Get Started button */}
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
                    "Get Started"
                  )}
                </Button>

                {/* Bundle with plan options */}
                {isAdvertisingOnly && selectedAdChannels.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground text-center mb-3">
                      or bundle with:
                    </p>
                    <div className="flex flex-col gap-2">
                      {/* Single plan with add-on options */}
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBundleWithPlan('single')}
                          className="w-full text-xs border-primary/30 hover:bg-primary/5"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Single Plan ($888/mo)
                        </Button>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBundleWithPlan('single-seo')}
                            className="text-[10px] h-6 px-2 text-muted-foreground hover:text-primary"
                          >
                            + SEO/AEO ($888)
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBundleWithPlan('single-lms')}
                            className="text-[10px] h-6 px-2 text-muted-foreground hover:text-primary"
                          >
                            + Custom LMS ($2,450)
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBundleWithPlan('triple')}
                          className="flex-1 text-xs border-primary/30 hover:bg-primary/5"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Triple Plan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBundleWithPlan('full')}
                          className="flex-1 text-xs border-primary/30 hover:bg-primary/5"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Full Automation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
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
