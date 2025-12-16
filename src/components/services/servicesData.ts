
import { RocketIcon, ShoppingCartIcon, GlobeIcon, PenToolIcon, CalendarIcon, UsersIcon, SearchIcon } from "lucide-react";
import React from "react";

// Create wrapper functions without JSX syntax
const RocketIcon2 = (props: any) => React.createElement(RocketIcon, props);
const ShoppingCartIcon2 = (props: any) => React.createElement(ShoppingCartIcon, props);
const GlobeIcon2 = (props: any) => React.createElement(GlobeIcon, props);
const PenToolIcon2 = (props: any) => React.createElement(PenToolIcon, props);
const CalendarIcon2 = (props: any) => React.createElement(CalendarIcon, props);
const UsersIcon2 = (props: any) => React.createElement(UsersIcon, props);
const SearchIcon2 = (props: any) => React.createElement(SearchIcon, props);

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
    icon: SearchIcon2,
    title: "SEO/AEO Package",
    subtitle: "Search & AI Engine Optimization for maximum visibility",
    features: [
      "Comprehensive keyword research and optimization",
      "On-page and technical SEO audits",
      "AI search engine optimization (AEO) for voice & AI assistants",
      "Monthly performance reports and ranking improvements"
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
  }
];
