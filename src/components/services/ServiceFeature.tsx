
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface ServiceFeatureProps {
  feature: string;
  index: number;
}

const ServiceFeature = ({ feature, index }: ServiceFeatureProps) => {
  const isBundle = feature.startsWith("💡");
  
  const handleBundleClick = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isBundle) {
    const bundleText = feature.replace("💡 ", "");
    return (
      <motion.li 
        className="flex items-start"
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * index }}
        viewport={{ once: true }}
      >
        <motion.button
          onClick={handleBundleClick}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer group"
          whileHover={{ 
            scale: 1.02, 
            backgroundColor: "hsl(var(--primary) / 0.15)",
            borderColor: "hsl(var(--primary) / 0.4)"
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            whileHover={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Lightbulb className="h-5 w-5 text-primary shrink-0" />
          </motion.div>
          <span className="text-sm text-primary font-medium text-left">
            {bundleText}
          </span>
          <motion.svg 
            className="h-4 w-4 text-primary ml-auto shrink-0"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>
        </motion.button>
      </motion.li>
    );
  }

  return (
    <motion.li 
      className="text-sm text-muted-foreground flex items-start"
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      viewport={{ once: true }}
    >
      <svg className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>{feature}</span>
    </motion.li>
  );
};

export default ServiceFeature;
