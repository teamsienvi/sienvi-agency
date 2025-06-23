
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
    icon: PenToolIcon2,
    title: "Social Content Creation",
    subtitle: "AI-powered content generation for your brand",
    features: [
      "AI-assisted content creation (text, images, video)",
      "Brand-consistent messaging and visual assets",
      "Content optimization for different platforms",
      "Batch content generation for campaigns"
    ],
    price: "$888"
  },
  {
    icon: CalendarIcon2,
    title: "Social Posting Automation",
    subtitle: "Automated scheduling and publishing across platforms",
    features: [
      "Auto-scheduling and cross-posting to all major platforms",
      "Optimal timing analysis for maximum reach",
      "Content calendar management and planning",
      "Performance tracking and posting analytics"
    ],
    price: "$888"
  },
  {
    icon: UsersIcon2,
    title: "Social Engagement Management",
    subtitle: "AI-driven community management and interaction",
    features: [
      "Automated response management for comments and messages",
      "AI-powered engagement strategies and community building",
      "Real-time monitoring and sentiment analysis",
      "Influencer outreach and relationship management"
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
