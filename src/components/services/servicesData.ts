import { GlobeIcon, PenToolIcon, SearchIcon, BookOpenIcon, BotIcon, MegaphoneIcon, ShoppingBagIcon } from "lucide-react";
import React from "react";

// Create wrapper functions without JSX syntax
const GlobeIcon2 = (props: any) => React.createElement(GlobeIcon, props);
const PenToolIcon2 = (props: any) => React.createElement(PenToolIcon, props);
const SearchIcon2 = (props: any) => React.createElement(SearchIcon, props);
const BookOpenIcon2 = (props: any) => React.createElement(BookOpenIcon, props);
const BotIcon2 = (props: any) => React.createElement(BotIcon, props);
const MegaphoneIcon2 = (props: any) => React.createElement(MegaphoneIcon, props);
const ShoppingBagIcon2 = (props: any) => React.createElement(ShoppingBagIcon, props);

export const services = [
  // Row 1: Custom LMS, Social Media Suite, Advertising
  {
    id: "custom-lms",
    icon: BookOpenIcon2,
    title: "Custom LMS Package",
    subtitle: "Tailored learning management system for your business",
    features: [
      "Custom course creation and content management",
      "Student progress tracking and analytics",
      "Interactive quizzes and assessments",
      "Branded learning portal with user management",
      "💡 Bundle with Custom AI Assistant or Social Media Suite to save"
    ],
    price: "Custom Pricing"
  },
  {
    id: "social-media-suite",
    icon: PenToolIcon2,
    title: "Social Media Suite",
    subtitle: "Complete social media management and automation",
    features: [
      "Unlimited content creation",
      "All major channels including Facebook, Instagram, LinkedIn, TikTok, YouTube",
      "AI-assisted content creation (text, images, video)",
      "Auto-scheduling and cross-posting to all major platforms",
      "Automated engagement and community management",
      "Performance tracking and analytics",
      "💡 Bundle with Custom AI Assistant or SEO/AEO to save"
    ],
    price: "Custom Pricing"
  },
  {
    id: "advertising-package",
    icon: MegaphoneIcon2,
    title: "Advertising Package (Per Channel)",
    subtitle: "Multi-channel advertising across major platforms",
    features: [
      "Amazon, Google, Meta, TikTok, YouTube, Reddit, LinkedIn",
      "Campaign strategy and planning",
      "Ad creative development",
      "Performance optimization",
      "Detailed analytics and reporting",
      "Budget management and allocation",
      "💡 Select 3+ channels for bundle discount"
    ],
    price: "Custom Pricing",
    isAdvertising: true
  },
  // Row 2: Custom AI Assistant, Custom Website, SEO/AEO
  {
    id: "custom-ai-assistant",
    icon: BotIcon2,
    title: "Custom AI Assistant",
    subtitle: "AI-powered assistant tailored to your business needs",
    features: [
      "Strategy and Scoping",
      "Knowledge and Content Ingestion",
      "GPT design and behavior",
      "Tools and integrations",
      "Core workflows included as skills",
      "Testing and quality assurance",
      "Safety, privacy, and governance",
      "Deployment and handoff",
      "Ongoing optimization (monthly retainer option)",
      "💡 Bundle with Custom Website or LMS to save"
    ],
    price: "Custom Pricing"
  },
  {
    id: "custom-website",
    icon: GlobeIcon2,
    title: "Custom Website Development",
    subtitle: "Sleek, modern, and conversion-focused websites",
    features: [
      "Strategy and planning",
      "Design deliverables",
      "Core build and functionality",
      "Custom conversion features",
      "SEO foundation",
      "Performance and security",
      "Analytics and tracking",
      "Trust builders and compliance",
      "Training and support",
      "💡 Bundle with SEO/AEO or Custom AI Assistant to save"
    ],
    price: "Custom Pricing"
  },
  {
    id: "seo-aeo",
    icon: SearchIcon2,
    title: "SEO/AEO Package",
    subtitle: "Search and answer engine optimization for lasting visibility",
    features: [
      "Keyword Research and Implementation",
      "Strategic blog content creation and optimization",
      "Backlink strategy and quality link acquisition",
      "On-page and technical SEO improvements",
      "Modern AI-powered SEO/AEO tools for search and answer engine performance",
      "💡 Bundle with Custom Website or Custom AI Assistant to save"
    ],
    price: "Custom Pricing"
  },
  {
    id: "amazon-design",
    icon: ShoppingBagIcon2,
    title: "Amazon Design Package",
    subtitle: "Professional Amazon listing design and optimization",
    features: [
      "A+ Content / Premium A+ design",
      "Main image and infographic creation",
      "Lifestyle and product photography guidance",
      "Brand Story design",
      "Storefront design and optimization",
      "Video ad creative development",
      "Competitor analysis and positioning",
      "💡 Perfect for Amazon sellers looking to stand out"
    ],
    price: "Custom Pricing",
    isAmazon: true
  }
];
