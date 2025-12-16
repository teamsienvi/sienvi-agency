
import { motion } from "framer-motion";
import ServiceCard from "./services/ServiceCard";
import { services, addOns } from "./services/servicesData";

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
            We specialize in digital solutions that simplify and optimize 
            business operations. From website development and SEO to custom AI products, 
            our services help you scale efficiently with modern technology.
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
              contractNote={service.contractNote}
              monthlySupport={service.monthlySupport}
              standalone={service.standalone}
            />
          ))}
        </div>

        {/* A La Carte Add-Ons Section */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">A La Carte Add-Ons</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {addOns.map((addon, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-sm font-medium text-gray-800 mb-2">{addon.title}</p>
                <p className="text-plc-purple font-bold">{addon.price}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
