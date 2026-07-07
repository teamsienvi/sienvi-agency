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
    <section id="pricing" className="section-padding bg-transparent overflow-hidden relative z-10">
      <div className="container-custom">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stack Your Automation & Save</h2>
          <p className="max-w-3xl mx-auto text-slate-300">
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
          className="mt-16 bg-plc-purple/20 backdrop-blur-md text-white rounded-2xl p-10 text-center border border-plc-purple/30 shadow-2xl"
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
            boxShadow: "0 20px 40px rgba(139, 92, 246, 0.2)",
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
          <p className="mb-8 max-w-2xl mx-auto">
            Take that first step towards reaching your full potential. Schedule a strategy call 
            today and discover how Sienvi can help you achieve your goals.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="bg-plc-purple hover:bg-plc-purple/90 text-white"
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
