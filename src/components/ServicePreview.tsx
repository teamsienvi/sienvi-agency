
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ServicePreview = () => {
  const services = [
    {
      title: "Agency Support",
      description: "Premium solutions tailored for your business growth"
    },
    {
      title: "Business Coaching",
      description: "Powerful solutions tailored for your business growth"
    },
    {
      title: "AI Automation",
      description: "Automated solutions tailored for your business growth"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: { 
      scale: 1.05,
      y: -10,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  return (
    <section className="bg-transparent py-16 relative z-10">
      <div className="container-custom">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {services.map((service, index) => (
            <motion.div 
              key={index} 
              className="bg-plc-dark/50 backdrop-blur-sm rounded-xl p-6 border border-white/5"
              variants={itemVariants}
              whileHover="hover"
            >
              <motion.h3 
                className="text-plc-purple font-semibold mb-3"
                whileHover={{ scale: 1.05 }}
              >
                {service.title}
              </motion.h3>
              <motion.p 
                className="text-white/80 text-sm mb-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                {service.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicePreview;
