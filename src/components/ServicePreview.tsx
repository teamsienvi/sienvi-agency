
import { Button } from "@/components/ui/button";

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

  return (
    <section className="bg-plc-dark-secondary py-16">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="bg-plc-dark/50 backdrop-blur-sm rounded-xl p-6 hover-lift border border-white/5"
            >
              <h3 className="text-plc-purple font-semibold mb-3">{service.title}</h3>
              <p className="text-white/80 text-sm mb-0">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicePreview;
