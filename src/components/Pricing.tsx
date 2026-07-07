import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PricingCard from "./pricing/PricingCard";
import { pricingTiers } from "./pricing/pricingData";

// Updated Google Calendar appointment URL
const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Pricing = () => {
  
  const handleBookCall = () => {
    window.location.href = CALENDAR_BOOKING_URL;
  };

  return (
    <section id="pricing" className="section-padding bg-transparent text-white overflow-hidden">
      <div className="container-custom">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-16 p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Corner Drafting Marks */}
          <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-sienvi-gradient bg-clip-text text-transparent inline-block">Stack Your Automation & Save</h2>
          <p className="text-gray-300 font-light mt-2">
            Choose the automation package that works best for your business needs and 
            scale efficiently with our bundled services.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <PricingCard key={index} {...tier} index={index} />
          ))}
        </div>
        
        <motion.div 
          className="mt-16 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl p-10 text-center relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8,
            delay: 0.3,
            type: "spring",
            stiffness: 100
          }}
          viewport={{ once: true }}
          whileHover={{ 
            boxShadow: "0 20px 40px rgba(0, 229, 255, 0.15)",
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
        >
          {/* Corner Drafting Marks */}
          <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

          <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">Ready to Transform Your Business?</h3>
          <p className="mb-8 max-w-2xl mx-auto text-gray-300 font-light">
            Take that first step towards reaching your full potential. Schedule a strategy call 
            today and discover how Sienvi can help you achieve your goals.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              onClick={handleBookCall}
            >
              Book Your Strategy Call
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
