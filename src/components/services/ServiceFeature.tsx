
import { motion } from "framer-motion";

interface ServiceFeatureProps {
  feature: string;
  index: number;
}

const ServiceFeature = ({ feature, index }: ServiceFeatureProps) => {
  return (
    <motion.li 
      className="text-sm text-gray-700 flex items-start"
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      viewport={{ once: true }}
    >
      <svg className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>{feature}</span>
    </motion.li>
  );
};

export default ServiceFeature;
