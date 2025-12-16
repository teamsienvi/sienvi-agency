
import { ShoppingCartIcon, GlobeIcon, PenToolIcon, SearchIcon, BookOpenIcon, BotIcon } from "lucide-react";
import React from "react";

// Create wrapper functions without JSX syntax
const ShoppingCartIcon2 = (props: any) => React.createElement(ShoppingCartIcon, props);
const GlobeIcon2 = (props: any) => React.createElement(GlobeIcon, props);
const PenToolIcon2 = (props: any) => React.createElement(PenToolIcon, props);
const SearchIcon2 = (props: any) => React.createElement(SearchIcon, props);
const BookOpenIcon2 = (props: any) => React.createElement(BookOpenIcon, props);
const BotIcon2 = (props: any) => React.createElement(BotIcon, props);

export const services = [
  {
    icon: PenToolIcon2,
    title: "Social Media Suite",
    subtitle: "Complete social media management and automation",
    features: [
      "AI-assisted content creation (text, images, video)",
      "Auto-scheduling and cross-posting to all major platforms",
      "Automated engagement and community management",
      "Performance tracking and analytics"
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
    title: "Website Buildout Package",
    subtitle: "Complete website development (3-month contract)",
    features: [
      "Sleek, modern, and conversion-focused websites",
      "Mobile-first, responsive designs",
      "Integrated booking and payment solutions",
      "Seamless user experiences tailored to your brand identity"
    ],
    price: "$888"
  },
  {
    icon: SearchIcon2,
    title: "SEO/AEO Website Package",
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
    icon: BookOpenIcon2,
    title: "Custom LMS Package",
    subtitle: "Tailored learning management system for your business",
    features: [
      "Custom course creation and content management",
      "Student progress tracking and analytics",
      "Interactive quizzes and assessments",
      "Branded learning portal with user management"
    ],
    price: "$888"
  },
  {
    icon: BotIcon2,
    title: "Custom GPT Product",
    subtitle: "AI-powered chatbot tailored to your business needs",
    features: [
      "Custom-trained AI assistant for your brand",
      "Seamless website or app integration",
      "24/7 automated customer support",
      "Perfect for client upselling and engagement"
    ],
    price: "$888"
  }
];
