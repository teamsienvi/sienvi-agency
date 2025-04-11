import { ChartBarIcon, RocketIcon, MessageSquareIcon, ShoppingCartIcon, ListTodoIcon, GlobeIcon, BarChartIcon } from "lucide-react";
import { motion } from "framer-motion";

// Create extended icons with custom props
const ChartBarIcon2 = (props: any) => <ChartBarIcon {...props} />;
const RocketIcon2 = (props: any) => <RocketIcon {...props} />;
const MessageSquareIcon2 = (props: any) => <MessageSquareIcon {...props} />;
const ShoppingCartIcon2 = (props: any) => <ShoppingCartIcon {...props} />;
const GlobeIcon2 = (props: any) => <GlobeIcon {...props} />;
const BarChartIcon2 = (props: any) => <BarChartIcon {...props} />;

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
  index
}: { 
  icon: React.ComponentType<any>, 
  title: string, 
  subtitle: string, 
  features: string[], 
  price: string,
  index: number
}) => {
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
          <motion.li 
            key={idx} 
            className="text-sm text-gray-700 flex items-start"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx }}
            viewport={{ once: true }}
          >
            <svg className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{feature}</span>
          </motion.li>
        ))}
      </ul>
      <motion.div 
        className="text-plc-purple font-bold text-xl"
        whileHover={{ scale: 1.1 }}
      >
        {price}/month
      </motion.div>
    </motion.div>
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
      price: "$888"
    },
    {
      icon: RocketIcon2,
      title: "Business Automation Suite",
      subtitle: "Comprehensive automation solutions for your business",
      features: [
        "AI-powered ad optimization and automated bid adjustments",
        "Automated task management and delegation systems",
        "Implementation of AI-driven tools for business processes",
        "Custom strategies for scaling efficiency across all operations"
      ],
      price: "$888"
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
      price: "$888"
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
      price: "$888"
    },
    {
      icon: GlobeIcon2,
      title: "Website Design & Development",
      subtitle: "Creating powerful online presence for your brand",
      features: [
        "Sleek, modern, and conversion-focused websites",
        "Mobile-first, responsive designs",
        "Integrated booking and payment solutions",
        "Seamless user experiences tailored to your brand identity",
        "Strategic sales funnel development to maximize conversions"
      ],
      price: "$888"
    },
    {
      icon: BarChartIcon2,
      title: "Data Analysis & Bookkeeping",
      subtitle: "Financial insights for strategic business decisions",
      features: [
        "Expert handling of business financials",
        "Comprehensive analytics for decision-making",
        "Clear, accurate, and actionable insights",
        "Strategic guidance for business growth"
      ],
      price: "$888"
    }
  ];

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
