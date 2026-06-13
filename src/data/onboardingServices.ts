import { PenTool, Globe, Search, BookOpen, Bot, ShoppingBag, Wrench, LucideIcon } from "lucide-react";

export interface OnboardingService {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isPremium?: boolean; // $2450 services
  hasSpecialOnboarding?: boolean; // Uses different onboarding form
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
    id: "custom-ai-assistant",
    title: "Custom AI Assistant",
    description: "AI-powered assistant tailored to your business needs",
    icon: Bot,
  },
  {
    id: "custom-tool",
    title: "Custom Tool",
    description: "Custom software tools and internal applications designed for your business needs",
    icon: Wrench,
  },
  {
    id: "amazon-design",
    title: "Amazon Design Package",
    description: "Professional Amazon listing design and optimization",
    icon: ShoppingBag,
    hasSpecialOnboarding: true, // Uses Amazon-specific questionnaire
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
  full: 5,
  custom: 5, // Default for custom, will be overridden by metadata
};

export const planDisplayNames: Record<string, string> = {
  single: "Single Service",
  triple: "Triple Bundle",
  full: "Full Suite",
  custom: "Custom Plan",
};
