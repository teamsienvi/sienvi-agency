
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="bg-plc-dark text-white py-24 md:py-32 overflow-hidden">
      <div className="container-custom">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div 
            className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6,
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
            Park Lines Concepts helps entrepreneurs, course creators, and small businesses 
            scale with premium agency services, coaching, and AI automation tools.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="w-full bg-plc-purple hover:bg-plc-purple/90 text-white button-shadow">
                Book Your Strategy Call
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                Explore Services
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
