import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Updated Google Calendar appointment URL
const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Hero = () => {
  const handleBookCall = () => {
    // Use window.location.href instead of window.open
    window.location.href = CALENDAR_BOOKING_URL;
  };

  return (
    <section className="text-white pt-[200px] pb-24 md:pb-32 overflow-hidden bg-transparent">
      <div className="container-custom">
        <div className="relative p-8 md:p-12 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-lg max-w-2xl mx-auto shadow-2xl">
          {/* Corner Drafting Marks */}
          <span className="absolute -top-1.5 -left-1.5 text-xs text-primary/65 font-mono">+</span>
          <span className="absolute -top-1.5 -right-1.5 text-xs text-primary/65 font-mono">+</span>
          <span className="absolute -bottom-1.5 -left-1.5 text-xs text-primary/65 font-mono">+</span>
          <span className="absolute -bottom-1.5 -right-1.5 text-xs text-primary/65 font-mono">+</span>

          <div className="flex flex-col items-center text-center">
            <motion.div 
              className="inline-block bg-primary/10 border border-primary/20 rounded-full px-4 py-1 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 100
              }}
            >
              <span className="text-xs font-medium text-primary">Premium Agency Support</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.7,
                delay: 0.1,
                type: "spring",
                stiffness: 50
              }}
            >
              Sienvi Agency: Turn Your Vision Into{" "}
              <motion.span 
                className="bg-sienvi-gradient bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Business Reality
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-md text-gray-300 mb-8 max-w-xl font-light leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Sienvi helps entrepreneurs, course creators, and small businesses 
              scale with premium agency services, coaching, and AI automation tools.
            </motion.p>
            
            <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-300"
                  onClick={handleBookCall}
                >
                  Book Your Strategy Call
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
