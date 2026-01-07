
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
        className="text-sm flex items-start mt-3 pt-3 border-t border-primary/20"
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * index }}
        viewport={{ once: true }}
      >
        <button
          onClick={handleBundleClick}
          className="flex items-start text-left w-full group cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Lightbulb className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
          <span className="text-primary font-medium underline underline-offset-2 decoration-primary/50 group-hover:decoration-primary transition-colors">
            {bundleText}
          </span>
        </button>
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
