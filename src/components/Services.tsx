
import { motion } from "framer-motion";
import ServiceCard from "./services/ServiceCard";
import { services } from "./services/servicesData";

const Services = () => {
  return (
    <section id="services" className="section-padding bg-plc-purple-light overflow-hidden">
      <div className="container-custom">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Services</h2>
          <p className="max-w-3xl mx-auto text-gray-600">
            We specialize in AI-driven automation solutions that simplify and optimize 
            business operations. Whether you're an eCommerce seller, a small business 
            owner, or a digital entrepreneur, our services help you scale efficiently with data-driven 
            insights and automated systems.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              icon={service.icon}
              title={service.title}
              subtitle={service.subtitle}
              features={service.features}
              price={service.price}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
