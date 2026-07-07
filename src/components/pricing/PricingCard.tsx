import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { pricingVariants } from "./pricingAnimations";
import PricingFeature from "./PricingFeature";
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

  const handleInquire = () => {
    const subject = encodeURIComponent(`Inquiry about ${title} Package`);
    const body = encodeURIComponent(`Hello Sienvi Team,\n\nI would like to inquire about the details for your "${title}" package.\n\nThank you!`);
    window.location.href = `mailto:info@sienvi.com?subject=${subject}&body=${body}`;
  };

  return (
    <motion.div 
      className={`bg-card/85 border border-dashed backdrop-blur-md rounded-2xl shadow-lg relative ${popular ? 'border-primary' : 'border-border'}`}
      variants={pricingVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover="hover"
      transition={{ delay: index * 0.1 }}
    >
      {/* Corner Drafting Marks */}
      <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
      <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
      <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
      <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

      {popular && (
        <motion.div 
          className="absolute -top-4 right-8 bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.4)]"
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
          <span className="text-3xl font-bold text-primary">{price}</span>
        </motion.div>
        <p className="text-gray-300 text-sm mb-6 font-light">{description}</p>
        
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
            className={`w-full ${popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background border border-border text-foreground hover:bg-card'}`}
            onClick={handleInquire}
          >
            Inquire Now
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PricingCard;
