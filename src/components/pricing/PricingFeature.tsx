
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface PricingFeatureProps {
  feature: string;
  index: number;
}

const PricingFeature = ({ feature, index }: PricingFeatureProps) => {
  return (
    <motion.li 
      key={index} 
      className="flex items-start"
      initial="hidden"
      whileInView="visible"
      transition={{ delay: 0.1 * index }}
      viewport={{ once: true }}
    >
      <motion.div
        whileHover={{ scale: 1.2, color: "#8B5CF6" }}
      >
        <Check className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" />
      </motion.div>
      <span className="text-sm">{feature}</span>
    </motion.li>
  );
};

export default PricingFeature;
