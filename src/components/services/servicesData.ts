
import { GlobeIcon, PenToolIcon, SearchIcon, BotIcon, BookOpenIcon, ShoppingCartIcon } from "lucide-react";
import React from "react";

// Create wrapper functions without JSX syntax
const GlobeIcon2 = (props: any) => React.createElement(GlobeIcon, props);
const PenToolIcon2 = (props: any) => React.createElement(PenToolIcon, props);
const SearchIcon2 = (props: any) => React.createElement(SearchIcon, props);
const BotIcon2 = (props: any) => React.createElement(BotIcon, props);
const BookOpenIcon2 = (props: any) => React.createElement(BookOpenIcon, props);
const ShoppingCartIcon2 = (props: any) => React.createElement(ShoppingCartIcon, props);

export interface ServiceItem {
  icon: (props: any) => React.ReactElement;
  title: string;
  subtitle: string;
  features: string[];
  price: string;
  contractNote?: string;
  monthlySupport?: string;
  standalone?: boolean;
}

export const services: ServiceItem[] = [
  {
    icon: GlobeIcon2,
    title: "Website Buildout Package",
    subtitle: "Professional website design & development (3-month contract)",
    features: [
      "Sleek, modern, and conversion-focused websites",
      "Mobile-first, responsive designs",
      "Integrated booking and payment solutions",
      "Seamless user experiences tailored to your brand identity",
      "Strategic sales funnel development to maximize conversions"
    ],
    price: "$888/mo",
    contractNote: "3-month minimum"
  },
  {
    icon: SearchIcon2,
    title: "SEO/AEO Package",
    subtitle: "Search & AI Engine Optimization for maximum visibility",
    features: [
      "Comprehensive keyword research and on-page SEO",
      "AI Engine Optimization (AEO) for voice & AI search",
      "Technical SEO audits and performance optimization",
      "Monthly ranking reports and strategy adjustments",
      "Local SEO and Google Business Profile optimization"
    ],
    price: "$888/mo",
    standalone: true
  },
  {
    icon: PenToolIcon2,
    title: "Social Media Suite",
    subtitle: "Complete social media management in one package",
    features: [
      "AI-powered content creation (text, images, video)",
      "Auto-scheduling and cross-posting to all major platforms",
      "Automated engagement and community management",
      "Performance analytics and optimization",
      "Brand-consistent messaging across all channels"
    ],
    price: "$888/mo"
  },
  {
    icon: BotIcon2,
    title: "Custom GPT Product",
    subtitle: "AI-powered chatbot tailored for your business",
    features: [
      "Custom-trained GPT on your business knowledge base",
      "Seamless integration with your website or platform",
      "Lead qualification and customer support automation",
      "Perfect for client upsells and service enhancement",
      "Continuous learning and improvement"
    ],
    price: "$1,500 setup",
    monthlySupport: "$299/mo"
  },
  {
    icon: BookOpenIcon2,
    title: "Custom LMS Package",
    subtitle: "Learning Management System for courses & training",
    features: [
      "Custom-branded learning platform",
      "Course creation and content hosting",
      "Student progress tracking and analytics",
      "Payment integration for course sales",
      "Certificates and completion tracking"
    ],
    price: "$2,500 setup",
    monthlySupport: "$499/mo"
  },
  {
    icon: ShoppingCartIcon2,
    title: "E-Commerce Operations",
    subtitle: "Multi-channel inventory & process optimization",
    features: [
      "Automated inventory tracking across multiple platforms",
      "AI-powered demand forecasting to prevent stockouts",
      "Streamlined order fulfillment and shipping automation",
      "AI-driven customer service chatbot integration"
    ],
    price: "$888/mo"
  }
];

// A la carte add-ons
export const addOns = [
  {
    title: "Additional Website Pages",
    price: "$150/page"
  },
  {
    title: "Custom Integrations",
    price: "$200/integration"
  },
  {
    title: "Priority Support",
    price: "$199/mo"
  },
  {
    title: "Content Writing (per article)",
    price: "$75/article"
  },
  {
    title: "Video Editing",
    price: "$150/video"
  },
  {
    title: "Custom GPT Monthly Support",
    price: "$299/mo"
  }
];
