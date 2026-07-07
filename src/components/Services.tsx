
import { motion } from "framer-motion";
import ServiceCard from "./services/ServiceCard";
import { services } from "./services/servicesData";

const Services = () => {
  return (
    <section id="services" className="section-padding bg-transparent overflow-hidden text-white">
      <div className="container-custom">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-16 p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Corner Drafting Marks */}
          <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-sienvi-gradient bg-clip-text text-transparent inline-block">Our Core Services</h2>
          <p className="text-gray-300 font-light mt-2">
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
              serviceId={service.id}
              isAdvertising={'isAdvertising' in service ? service.isAdvertising : false}
              isAmazon={'isAmazon' in service ? service.isAmazon : false}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
