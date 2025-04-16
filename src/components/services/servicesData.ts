
import { ChartBarIcon, RocketIcon, MessageSquareIcon, ShoppingCartIcon, GlobeIcon, BarChartIcon } from "lucide-react";

// Create extended icons with custom props
const ChartBarIcon2 = (props: any) => <ChartBarIcon {...props} />;
const RocketIcon2 = (props: any) => <RocketIcon {...props} />;
const MessageSquareIcon2 = (props: any) => <MessageSquareIcon {...props} />;
const ShoppingCartIcon2 = (props: any) => <ShoppingCartIcon {...props} />;
const GlobeIcon2 = (props: any) => <GlobeIcon {...props} />;
const BarChartIcon2 = (props: any) => <BarChartIcon {...props} />;

export const services = [
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
