import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricingVariants } from "./pricingAnimations";
import CustomBundleModal from "./CustomBundleModal";

interface CustomBundleCardProps {
  index: number;
  isAdmin?: boolean;
}

const CustomBundleCard = ({ index, isAdmin = false }: CustomBundleCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show the card to admins or if explicitly enabled
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <motion.div
        className="bg-gradient-to-br from-primary/5 via-background to-primary/10 rounded-2xl shadow-lg border-2 border-dashed border-primary/30 relative overflow-hidden"
        variants={pricingVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        whileHover="hover"
        transition={{ delay: index * 0.1 }}
      >
        {/* Premium badge */}
        <motion.div
          className="absolute -top-4 right-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1"
          initial={{ opacity: 0, rotate: -5, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 2, scale: 1 }}
          transition={{
            delay: 0.5,
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
        >
          <Settings className="w-3 h-3" />
          ADMIN ONLY
        </motion.div>

        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">Custom Bundle</h3>
          </div>

          <motion.div className="mb-4" whileHover={{ scale: 1.02 }}>
            <span className="text-2xl font-bold text-primary">Custom Pricing</span>
            <p className="text-muted-foreground text-sm mt-1">Tailored to client needs</p>
          </motion.div>

          <p className="text-muted-foreground text-sm mb-6">
            Create a personalized automation package with custom pricing and service limits for special clients.
          </p>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-xs">✓</span>
              Set custom monthly price
            </li>
            <li className="flex items-center text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-xs">✓</span>
              Define service limit (1-6)
            </li>
            <li className="flex items-center text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-xs">✓</span>
              Add internal notes
            </li>
            <li className="flex items-center text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-xs">✓</span>
              Full Stripe integration
            </li>
          </ul>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setIsModalOpen(true)}
            >
              Create Custom Bundle
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <CustomBundleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default CustomBundleCard;
