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
    const subject = encodeURIComponent(`Inquiry about ${title}`);
    const body = encodeURIComponent(`Hello Sienvi Team,\n\nI am interested in learning more about your ${title}. Could you please provide details and help with custom scoping for this package?\n\nThank you!`);
    window.location.href = `mailto:info@sienvi.com,teamsienvi@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <motion.div 
      className={`bg-slate-900/65 backdrop-blur-md rounded-2xl shadow-2xl border ${popular ? 'border-plc-purple relative' : 'border-slate-800/80'} text-white`}
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
        </motion.div>
        <p className="text-slate-300 text-sm mb-6">{description}</p>
        
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
            className={`w-full ${popular ? 'bg-plc-purple hover:bg-plc-purple/90 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100'}`}
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
