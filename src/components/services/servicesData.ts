
import { RocketIcon, ShoppingCartIcon, GlobeIcon, PenToolIcon, CalendarIcon, UsersIcon } from "lucide-react";
import React from "react";

// Create wrapper functions without JSX syntax
const RocketIcon2 = (props: any) => React.createElement(RocketIcon, props);
const ShoppingCartIcon2 = (props: any) => React.createElement(ShoppingCartIcon, props);
const GlobeIcon2 = (props: any) => React.createElement(GlobeIcon, props);
const PenToolIcon2 = (props: any) => React.createElement(PenToolIcon, props);
const CalendarIcon2 = (props: any) => React.createElement(CalendarIcon, props);
const UsersIcon2 = (props: any) => React.createElement(UsersIcon, props);

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
  }
];
