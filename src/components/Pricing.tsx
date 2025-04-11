
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const pricingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  },
  hover: { 
    scale: 1.03,
    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
    y: -5,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

const featureVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

const PricingTier = ({ 
  title, 
  price, 
  description, 
  features, 
  popular = false,
  index
}: { 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  popular?: boolean,
  index: number
}) => {
  return (
    <motion.div 
      className={`bg-white rounded-2xl shadow-lg border ${popular ? 'border-plc-purple relative' : 'border-gray-200'}`}
      variants={pricingVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover="hover"
      transition={{ delay: index * 0.1 }}
    >
      {popular && (
        <motion.div 
          className="absolute -top-4 right-8 bg-plc-purple text-white text-xs font-bold py-1 px-3 rounded-full"
          initial={{ opacity: 0, rotate: -5, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 2, scale: 1 }}
          transition={{ 
            delay: 0.5,
            duration: 0.5,
            type: "spring",
            stiffness: 200
          }}
        >
          MOST POPULAR
        </motion.div>
      )}
      <div className="p-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <motion.div 
          className="mb-4"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-gray-500 ml-1">per month</span>
        </motion.div>
        <p className="text-gray-600 text-sm mb-6">{description}</p>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <motion.li 
              key={idx} 
              className="flex items-start"
              variants={featureVariants}
              initial="hidden"
              whileInView="visible"
              transition={{ delay: 0.1 * idx }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ scale: 1.2, color: "#8B5CF6" }}
              >
                <Check className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" />
              </motion.div>
              <span className="text-sm">{feature}</span>
            </motion.li>
          ))}
        </ul>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            className={`w-full ${popular ? 'bg-plc-purple hover:bg-plc-purple/90 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Pricing = () => {
  return (
    <section id="pricing" className="section-padding bg-gray-50 overflow-hidden">
      <div className="container-custom">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stack Your Automation & Save</h2>
          <p className="max-w-3xl mx-auto text-gray-600">
            Choose the automation package that works best for your business needs and 
            scale efficiently with our bundled services.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <PricingTier 
            title="Single Service" 
            price="$888"
            description="Perfect for businesses looking to automate one area of their operations."
            features={[
              "Full access to one core service",
              "Detailed onboarding process",
              "25% consulting call discount",
              "Monthly performance reports",
              "Dedicated account manager"
            ]}
            index={0}
          />
          
          <PricingTier 
            title="Triple Automation" 
            price="$2,398.20"
            description="Our most popular package for businesses ready to integrate multiple services."
            features={[
              "Full access to three core services",
              "10% discount on package price",
              "15% consulting call discount",
              "Weekly performance reports",
              "Dedicated account manager",
              "Quarterly strategy sessions"
            ]}
            popular={true}
            index={1}
          />
          
          <PricingTier 
            title="Full Automation" 
            price="$3,996.00"
            description="The complete solution for businesses ready to fully integrate automation."
            features={[
              "All six core automation services",
              "25% discount on package price",
              "VIP support with 2-hour response",
              "Bi-weekly performance reports",
              "Dedicated senior account manager",
              "Monthly strategy and optimization reviews"
            ]}
            index={2}
          />
        </div>
        
        <motion.div 
          className="mt-16 bg-plc-purple text-white rounded-2xl p-10 text-center"
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
            boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)",
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
          <p className="mb-8 max-w-2xl mx-auto">
            Take that first step towards reaching your full potential. Schedule a strategy call 
            today and discover how Park Lines Concepts can help you achieve your goals.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="bg-white text-plc-purple hover:bg-gray-100">
              Book Your Strategy Call
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
