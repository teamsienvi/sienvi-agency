import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricingVariants } from "./pricingAnimations";
import PricingFeature from "./PricingFeature";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PricingTier } from "./pricingData";

interface PricingCardProps extends PricingTier {
  index: number;
}

const PricingCard = ({ 
  title, 
  price, 
  description, 
  features, 
  popular = false,
  priceId,
  index
}: PricingCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId },
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
    <motion.div 
      className={`bg-white rounded-2xl shadow-lg border ${popular ? 'border-plc-purple relative' : 'border-gray-200'}`}
      variants={pricingVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover="hover"
      transition={{ delay: index * 0.1 }}
    >
      {popular && (
        <motion.div 
          className="absolute -top-4 right-8 bg-plc-purple text-white text-xs font-bold py-1 px-3 rounded-full"
          initial={{ opacity: 0, rotate: -5, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 2, scale: 1 }}
          transition={{ 
            delay: 0.5,
            duration: 0.5,
            type: "spring",
            stiffness: 200
          }}
        >
          MOST POPULAR
        </motion.div>
      )}
      <div className="p-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <motion.div 
          className="mb-4"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-gray-500 ml-1">per month</span>
        </motion.div>
        <p className="text-gray-600 text-sm mb-6">{description}</p>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <PricingFeature key={idx} feature={feature} index={idx} />
          ))}
        </ul>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            className={`w-full ${popular ? 'bg-plc-purple hover:bg-plc-purple/90 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
            onClick={handleGetStarted}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PricingCard;
