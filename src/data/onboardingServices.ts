import { PenTool, ShoppingCart, Globe, Search, BookOpen, Bot, LucideIcon } from "lucide-react";

export interface OnboardingService {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isPremium?: boolean; // $2450 services
}

export const onboardingServices: OnboardingService[] = [
  {
    id: "social-media-suite",
    title: "Social Media Suite",
    description: "Complete social media management and automation across all major platforms",
    icon: PenTool,
    isPremium: true, // $2450
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
    isPremium: true, // $2450
  },
  {
    id: "custom-gpt",
    title: "Custom GPT Product",
    description: "AI-powered chatbot tailored to your business needs",
    icon: Bot,
  },
];

// Premium services that cost $2450 (excluded from single/triple bundles)
export const premiumServiceIds = ["social-media-suite", "custom-lms"];

// Get services available for a specific plan
export const getAvailableServicesForPlan = (plan: string) => {
  if (plan === "full") {
    // Full automation includes all services
    return onboardingServices;
  }
  // Single and Triple exclude premium services
  return onboardingServices.filter(s => !s.isPremium);
};

// Get all service IDs for full automation
export const getFullAutomationServiceIds = () => {
  return onboardingServices.map(s => s.id);
};

export const planLimits: Record<string, number> = {
  single: 1,
  triple: 3,
  full: 6,
  custom: 6, // Default for custom, will be overridden by metadata
};

export const planDisplayNames: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Bundle",
  full: "Full Suite",
  custom: "Custom Plan",
};
