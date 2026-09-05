import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ServiceFeature from "./ServiceFeature";

interface ServiceCardProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  features: string[];
  price: string;
  index: number;
  serviceId?: string;
  isAdvertising?: boolean;
  isAmazon?: boolean;
  presentationRoute?: string;
  badge?: string;
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
      damping: 10,
    },
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  },
};

const ServiceCard = ({
  icon: Icon,
  title,
  subtitle,
  features,
  price,
  index,
  serviceId,
  isAdvertising,
  isAmazon,
  presentationRoute,
  badge,
}: ServiceCardProps) => {
  const handleInquire = () => {
    const subject = encodeURIComponent(`Inquiry about ${title}`);
    const body = encodeURIComponent(`Hello Sienvi Team,\n\nI would like to inquire about the details and custom scoping for your "${title}" service.\n\nThank you!`);
    window.location.href = `mailto:info@sienvi.com?subject=${subject}&body=${body}`;
  };

  // Separate regular features from bundle suggestion
  const regularFeatures = features.filter((f) => !f.startsWith("💡"));
  const bundleFeature = features.find((f) => f.startsWith("💡"));

  return (
    <motion.div
      className="service-card flex flex-col relative"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover="hover"
      custom={index}
      transition={{ delay: index * 0.1 }}
    >
      {badge && (
        <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-[11px] font-bold tracking-wide">
          {badge}
        </div>
      )}
      <motion.div className="mb-6" whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.5 } }}>
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
      <div className="mt-auto space-y-3">
        {bundleFeature && (
          <div>
            <ServiceFeature feature={bundleFeature} index={regularFeatures.length} />
          </div>
        )}
        <motion.div className="text-primary font-bold text-xl" whileHover={{ scale: 1.05 }}>
          {price}
        </motion.div>
        {presentationRoute && (
          <Link to={presentationRoute} className="w-full block">
            <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-white transition font-medium">
              Learn More & View Presentation →
            </Button>
          </Link>
        )}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleInquire}>
            Inquire Now
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
