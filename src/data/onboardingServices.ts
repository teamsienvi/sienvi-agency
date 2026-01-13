import { PenTool, ShoppingCart, Globe, Search, BookOpen, Bot, LucideIcon } from "lucide-react";

export interface OnboardingService {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const onboardingServices: OnboardingService[] = [
  {
    id: "social-media-suite",
    title: "Social Media Suite",
    description: "Complete social media management and automation across all major platforms",
    icon: PenTool,
  },
  {
    id: "ecommerce-operations",
    title: "E-Commerce Operations Automation",
    description: "Multi-channel inventory tracking and process optimization",
    icon: ShoppingCart,
  },
  {
    id: "custom-website",
    title: "Custom Website Development",
    description: "Sleek, modern, and conversion-focused websites tailored to your brand",
    icon: Globe,
  },
  {
    id: "seo-aeo",
    title: "SEO/AEO Package",
    description: "Search and answer engine optimization for lasting visibility",
    icon: Search,
  },
  {
    id: "custom-lms",
    title: "Custom LMS Package",
    description: "Tailored learning management system for your business",
    icon: BookOpen,
  },
  {
    id: "custom-gpt",
    title: "Custom GPT Product",
    description: "AI-powered chatbot tailored to your business needs",
    icon: Bot,
  },
];

export const planLimits: Record<string, number> = {
  single: 1,
  triple: 3,
  full: 6,
};

export const planDisplayNames: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Bundle",
  full: "Full Suite",
};
