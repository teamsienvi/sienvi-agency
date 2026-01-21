
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ServiceFeature from "./ServiceFeature";

interface ServiceCardProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  features: string[];
  price: string;
  index: number;
  serviceId?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
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
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

const ServiceCard = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  features, 
  price,
  index,
  serviceId
}: ServiceCardProps) => {
  const navigate = useNavigate();
  
  // Separate regular features from bundle suggestion
  const regularFeatures = features.filter(f => !f.startsWith("💡"));
  const bundleFeature = features.find(f => f.startsWith("💡"));

  const handleGetStarted = () => {
    // Store the selected service and navigate to checkout summary
    if (serviceId) {
      sessionStorage.setItem("preselected_service", serviceId);
    }
    // Navigate to checkout summary page with service pre-selected
    navigate(`/checkout-summary?plan=single&service=${serviceId || ''}`);
  };

  return (
    <motion.div 
      className="service-card flex flex-col"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover="hover"
      custom={index}
      transition={{ delay: index * 0.1 }}
    >
      <motion.div 
        className="mb-6"
        whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.5 } }}
      >
        <Icon className="service-icon" />
      </motion.div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      
      {/* Regular features */}
      <ul className="space-y-2 mb-4 flex-grow">
        {regularFeatures.map((feature, idx) => (
          <ServiceFeature key={idx} feature={feature} index={idx} />
        ))}
      </ul>
      
      {/* Bundle suggestion and price at bottom */}
      <div className="mt-auto space-y-4">
        {bundleFeature && (
          <div>
            <ServiceFeature feature={bundleFeature} index={regularFeatures.length} />
          </div>
        )}
        <motion.div 
          className="text-primary font-bold text-xl"
          whileHover={{ scale: 1.05 }}
        >
          {price}/month
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
