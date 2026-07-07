
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
    // Split the text to style "Inquire for details" differently
    const parts = bundleText.split(" - ");
    const bundleInfo = parts[0];
    const inquireText = parts[1] || "Inquire for details";

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
          className="flex flex-col gap-2 w-full px-3 py-3 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer group overflow-hidden relative"
          whileHover={{ 
            scale: 1.02, 
            backgroundColor: "hsl(var(--primary) / 0.12)",
            borderColor: "hsl(var(--primary) / 0.4)"
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {/* Bundle info row */}
          <div className="flex items-center gap-2 w-full">
            <motion.div
              className="shrink-0"
              whileHover={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Lightbulb className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="text-sm text-primary font-medium text-left flex-1">
              {bundleInfo}
            </span>
          </div>
          
          {/* Inquire for details - styled uniquely */}
          <motion.div 
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-md bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 group-hover:from-primary group-hover:via-primary/90 group-hover:to-primary transition-all duration-300"
            whileHover={{ scale: 1.03 }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-primary group-hover:text-primary-foreground transition-colors duration-300">
              {inquireText}
            </span>
            <motion.svg 
              className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground transition-colors duration-300"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              initial={{ x: 0 }}
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </motion.div>
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
