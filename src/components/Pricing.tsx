
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PricingTier = ({ 
  title, 
  price, 
  description, 
  features, 
  popular = false 
}: { 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  popular?: boolean 
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border ${popular ? 'border-plc-purple relative' : 'border-gray-200'}`}>
      {popular && (
        <div className="absolute -top-4 right-8 bg-plc-purple text-white text-xs font-bold py-1 px-3 rounded-full transform rotate-2">
          MOST POPULAR
        </div>
      )}
      <div className="p-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-gray-500 ml-1">per month</span>
        </div>
        <p className="text-gray-600 text-sm mb-6">{description}</p>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <Check className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className={`w-full ${popular ? 'bg-plc-purple hover:bg-plc-purple/90 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

const Pricing = () => {
  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stack Your Automation & Save</h2>
          <p className="max-w-3xl mx-auto text-gray-600">
            Choose the automation package that works best for your business needs and 
            scale efficiently with our bundled services.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <PricingTier 
            title="Single Service" 
            price="$777"
            description="Perfect for businesses looking to automate one area of their operations."
            features={[
              "Full access to one core service",
              "Detailed onboarding process",
              "25% consulting call discount",
              "Monthly performance reports",
              "Dedicated account manager"
            ]}
          />
          
          <PricingTier 
            title="Triple Automation" 
            price="$2,099.10"
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
          />
          
          <PricingTier 
            title="Full Automation" 
            price="$2,917.50"
            description="The complete solution for businesses ready to fully integrate automation."
            features={[
              "All five core automation services",
              "25% discount on package price",
              "VIP support with 2-hour response",
              "Bi-weekly performance reports",
              "Dedicated senior account manager",
              "Monthly strategy and optimization reviews"
            ]}
          />
        </div>
        
        <div className="mt-16 bg-plc-purple text-white rounded-2xl p-10 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
          <p className="mb-8 max-w-2xl mx-auto">
            Take that first step towards reaching your full potential. Schedule a strategy call 
            today and discover how Park Lines Concepts can help you achieve your goals.
          </p>
          <Button className="bg-white text-plc-purple hover:bg-gray-100">
            Book Your Strategy Call
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
