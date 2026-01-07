
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
      "Performance tracking and analytics",
      "💡 Bundle with Custom GPT or SEO/AEO — Inquire for details"
    ],
    price: "$2450"
  },
  {
    icon: ShoppingCartIcon2,
    title: "E-Commerce Operations Automation",
    subtitle: "For Multi-Channel Inventory & Process Optimization",
    features: [
      "Automated inventory tracking across multiple platforms",
      "AI-powered demand forecasting to prevent stockouts",
      "Streamlined order fulfillment and shipping automation",
      "AI-driven customer service chatbot integration",
      "💡 Bundle with Custom Website or Custom GPT — Inquire for details"
    ],
    price: "$888"
  },
  {
    icon: GlobeIcon2,
    title: "Custom Website Development",
    subtitle: "Custom website development",
    features: [
      "Sleek, modern, and conversion-focused websites",
      "Mobile-first, responsive designs",
      "Integrated booking and payment solutions",
      "Seamless user experiences tailored to your brand identity",
      "💡 Bundle with SEO/AEO or Custom GPT — Inquire for details"
    ],
    price: "$888"
  },
  {
    icon: SearchIcon2,
    title: "SEO/AEO Package",
    subtitle: "Search and answer engine optimization for lasting visibility",
    features: [
      "Strategic blog content creation and optimization",
      "Backlink strategy and quality link acquisition",
      "On-page and technical SEO improvements",
      "Modern AI-powered SEO/AEO tools for search and answer engine performance",
      "💡 Bundle with Custom Website or Custom GPT — Inquire for details"
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
      "Branded learning portal with user management",
      "💡 Bundle with Custom GPT or Social Media Suite — Inquire for details"
    ],
    price: "$2450"
  },
  {
    icon: BotIcon2,
    title: "Custom GPT Product",
    subtitle: "AI-powered chatbot tailored to your business needs",
    features: [
      "Custom-trained AI assistant for your brand",
      "Seamless website or app integration",
      "24/7 automated customer support",
      "Perfect for client upselling and engagement",
      "💡 Bundle with Custom Website or LMS — Inquire for details"
    ],
    price: "$888"
  }
];
