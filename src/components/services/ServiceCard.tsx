
import { motion } from "framer-motion";
import ServiceFeature from "./ServiceFeature";

interface ServiceCardProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  features: string[];
  price: string;
  index: number;
  contractNote?: string;
  monthlySupport?: string;
  standalone?: boolean;
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
  contractNote,
  monthlySupport,
  standalone
}: ServiceCardProps) => {
  return (
    <motion.div 
      className="service-card"
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
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <ul className="space-y-2 mb-6">
        {features.map((feature, idx) => (
          <ServiceFeature key={idx} feature={feature} index={idx} />
        ))}
      </ul>
      <div className="mt-auto">
        <motion.div 
          className="text-plc-purple font-bold text-xl"
          whileHover={{ scale: 1.1 }}
        >
          {price}
        </motion.div>
        {monthlySupport && (
          <p className="text-sm text-gray-600 mt-1">+ {monthlySupport} support</p>
        )}
        {contractNote && (
          <p className="text-xs text-gray-500 mt-1">{contractNote}</p>
        )}
        {standalone && (
          <span className="inline-block mt-2 text-xs bg-plc-purple/10 text-plc-purple px-2 py-1 rounded-full">
            Available standalone
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ServiceCard;
