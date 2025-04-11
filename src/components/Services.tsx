
import { ChartBarIcon, RocketIcon, MessageSquareIcon, ShoppingCartIcon, ListTodoIcon } from "lucide-react";

// Create extended icons with custom props
const ChartBarIcon2 = (props: any) => <ChartBarIcon {...props} />;
const RocketIcon2 = (props: any) => <RocketIcon {...props} />;
const MessageSquareIcon2 = (props: any) => <MessageSquareIcon {...props} />;
const ShoppingCartIcon2 = (props: any) => <ShoppingCartIcon {...props} />;
const ListTodoIcon2 = (props: any) => <ListTodoIcon {...props} />;

const ServiceCard = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  features, 
  price 
}: { 
  icon: React.ComponentType<any>, 
  title: string, 
  subtitle: string, 
  features: string[], 
  price: string 
}) => {
  return (
    <div className="service-card">
      <div className="mb-6">
        <Icon className="service-icon" />
      </div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <ul className="space-y-2 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="text-sm text-gray-700 flex items-start">
            <svg className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="text-plc-purple font-bold text-xl">{price}/month</div>
    </div>
  );
};

const Services = () => {
  const services = [
    {
      icon: ChartBarIcon2,
      title: "Data Analysis & Insights",
      subtitle: "For eCommerce sellers leveraging multiple platforms",
      features: [
        "Centralized dashboards for key performance metrics",
        "Multi-platform sales tracking and reporting",
        "Custom alerts for inventory levels, sales fluctuations, and ad performance",
        "AI-driven insights on sales, inventory, and customer trends"
      ],
      price: "$777"
    },
    {
      icon: RocketIcon2,
      title: "PPC & Ad Automation",
      subtitle: "For Amazon, Google, and Social Ads",
      features: [
        "AI-powered ad optimization to maximize ROI",
        "Automated bid adjustments based on real-time performance",
        "Ad copy and creative testing using AI insights",
        "Custom strategies for scaling ad spend efficiently"
      ],
      price: "$777"
    },
    {
      icon: MessageSquareIcon2,
      title: "Social Content & Posting",
      subtitle: "For eCommerce brands Media Management",
      features: [
        "AI-assisted content creation (text, images, video)",
        "Auto-scheduling and cross-posting to all major platforms",
        "Performance tracking and engagement analysis",
        "AI-driven recommendations for best posting times and content strategy"
      ],
      price: "$777"
    },
    {
      icon: ShoppingCartIcon2,
      title: "E-Commerce Operations Automation",
      subtitle: "For Multi-Channel Inventory & Process Optimization",
      features: [
        "Automated inventory tracking across multiple platforms",
        "AI-powered demand forecasting to prevent stockouts",
        "Streamlined order fulfillment and shipping automation",
        "AI-driven customer service chatbot integration"
      ],
      price: "$777"
    },
    {
      icon: ListTodoIcon2,
      title: "Task & Workflow Automation",
      subtitle: "For Business Process Optimization",
      features: [
        "AI-powered review of current business processes",
        "Automated task management and delegation systems",
        "Implementation of AI-driven CRM and email tools",
        "Recommendations for optimized workflows using AI tools"
      ],
      price: "$777"
    }
  ];

  return (
    <section id="services" className="section-padding bg-plc-purple-light">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our 5 Core Services</h2>
          <p className="max-w-3xl mx-auto text-gray-600">
            We specialize in AI-driven automation solutions that simplify and optimize 
            business operations. Whether you're an eCommerce seller, a small business 
            owner, or a digital entrepreneur, our services help you scale efficiently with data-driven 
            insights and automated systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              icon={service.icon}
              title={service.title}
              subtitle={service.subtitle}
              features={service.features}
              price={service.price}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
