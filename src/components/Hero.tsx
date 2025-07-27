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
    <section className="hero-gradient text-white py-24 md:py-32 overflow-hidden">
      <div className="container-custom">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 100
            }}
          >
            <img 
              src="/lovable-uploads/9db0c2f7-eb51-4b0e-9a7f-6826c267607d.png" 
              alt="Sienvi Logo"
              className="h-[200pt] w-auto mx-auto"
            />
          </motion.div>
          
          <motion.div 
            className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6,
              delay: 0.1,
              type: "spring",
              stiffness: 100
            }}
          >
            <span className="text-xs font-medium">Premium Agency Support</span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.7,
              delay: 0.2,
              type: "spring",
              stiffness: 50
            }}
          >
            Turn Your Vision Into{" "}
            <motion.span 
              className="text-plc-purple"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Business Reality
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-300 mb-10 max-w-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Sienvi helps entrepreneurs, course creators, and small businesses 
            scale with premium agency services, coaching, and AI automation tools.
          </motion.p>
          
          <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full"
            >
              <Button 
                className="w-full bg-plc-purple hover:bg-plc-purple/90 text-white button-shadow"
                onClick={handleBookCall}
              >
                Book Your Strategy Call
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
