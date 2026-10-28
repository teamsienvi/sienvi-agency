export interface SubscriptionItem {
  id: string;
  label: string;
  plan: string | null;
  selectedServices: string[];
  monthlyAmount: number;
  billingDay: number | null;
  nextBillingDate: string | null;
  subscriptionStatus: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  isPrimary: boolean;
  notes: string | null;
  contractStatus?: string;
  contractDetails?: any;
}

export interface Client {
  id: string;
  email: string | null;
  clientName: string | null;
  plan: string | null;
  subscriptionStatus: string;
  isActive: boolean;
  selectedServices: string[];
  onboardingCompleted: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  customPrice: number | null;
  maxServices: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contractStatus?: string | null;
  contractDetails?: any;
  contractSignature?: string | null;
  contractSignedAt?: string | null;
  onboardingStatus?: string;
  accountStatus?: string;
  subscriptions?: SubscriptionItem[];
}

export const planPrices: Record<string, number> = {
  single: 888,
  triple: 2398.20,
  full: 3996,
  amazon: 999,
};

export const servicePrices: Record<string, number> = {
  "amazon-design": 999,
  "social-media-suite": 2450,
  "custom-lms": 2450,
  "custom-website": 888,
  "seo-aeo": 888,
  "custom-ai-assistant": 888,
};

export const isPartnershipClient = (client: Client | null | undefined): boolean => {
  if (!client) return false;
  const email = (client.email || "").toLowerCase();
  const name = (client.clientName || "").toLowerCase();
  const cd = client.contractDetails || {};
  return (
    client.plan === "partnership" ||
    client.plan === "nda" ||
    cd.relationshipType === "partnership" ||
    cd.isNda === true ||
    (typeof cd.uploadedContractName === "string" && cd.uploadedContractName.includes("CONFIDENTIALITY"))
  );
};

export const isCommissionClient = (client: Client | null | undefined): boolean => {
  if (!client) return false;
  const email = (client.email || "").toLowerCase();
  const name = (client.clientName || "").toLowerCase();
  const cd = client.contractDetails || {};
  return (
    email === "jordan@jordanellams.com" ||
    email === "michaelrrwilson@gmail.com" ||
    name.includes("jordan ellams") ||
    name.includes("michael wilson") ||
    cd.pricingModel === "commission" ||
    (typeof cd.uploadedContractName === "string" && cd.uploadedContractName.includes("IN THE DOME")) ||
    (typeof cd.uploadedProposalName === "string" && cd.uploadedProposalName.includes("IN THE DOME"))
  );
};

export const getMonthlyPrice = (
  plan: string | null,
  customPrice: number | null,
  selectedServices: string[] = []
): number => {
  if (plan === "partnership" || plan === "nda") return 0;
  if (plan === "custom" && customPrice !== null && customPrice !== undefined) return customPrice;
  if (plan === "custom" || plan === "prospect") return 0;
  
  if (plan === "amazon" || selectedServices.includes("amazon-design")) {
    return 999;
  }
  
  if (plan === "advertising" || selectedServices.includes("advertising-package")) {
    const channelCount = selectedServices.filter((s) => s.startsWith("channel-")).length;
    if (channelCount === 0) return 999;
    if (channelCount === 1) return 999;
    if (channelCount === 2) return 1998;
    if (channelCount >= 3) {
      return Math.min(channelCount * 493, 3450);
    }
    return 888;
  }
  
  if (plan === "single" && selectedServices.length > 0) {
    const service = selectedServices[0];
    return servicePrices[service] || planPrices[plan] || 0;
  }
  
  return planPrices[plan || ""] || 0;
};

export const getPlanDisplay = (
  plan: string | null,
  customPrice: number | null,
  selectedServices: string[] = [],
  client?: Client | null
): string => {
  if ((client && isPartnershipClient(client)) || plan === "partnership" || plan === "nda") {
    return "Partnership (Mutual NDA)";
  }
  if (plan === "prospect") {
    return "Prospect (Discovery)";
  }
  if (client && isCommissionClient(client)) {
    return "Custom (Commission-based)";
  }
  if (plan === "custom") {
    return "Custom Plan";
  }
  
  if (plan === "amazon" || selectedServices.includes("amazon-design")) {
    return "Amazon Design Package";
  }
  
  if (plan === "advertising" || selectedServices.includes("advertising-package")) {
    const channelCount = selectedServices.filter((s) => s.startsWith("channel-")).length;
    return channelCount ? `Advertising (${channelCount} ch)` : "Advertising Package";
  }
  
  const planLabels: Record<string, string> = {
    single: "Single Service",
    triple: "Triple Automation",
    full: "Full Automation",
  };
  return planLabels[plan || ""] || plan || "Unknown";
};

export const getOnboardingType = (client: Client): string => {
  const services = client.selectedServices || [];
  const plan = client.plan;
  
  if (plan === "prospect") {
    return "prospect";
  }
  if (services.includes("custom-tool") || plan === "custom-lms" || plan === "discovery") {
    return "discovery";
  }
  if (services.includes("amazon-design") || plan === "amazon") {
    return "amazon";
  }
  
  const hasAdvertising =
    plan === "advertising" ||
    services.includes("advertising-package") ||
    services.some((s: string) => s.startsWith("advertising")) ||
    services.some((s: string) => s.startsWith("channel-"));
  const hasGeneral = services.some(
    (s: string) =>
      !s.startsWith("channel-") &&
      s !== "advertising-package" &&
      s !== "amazon-design" &&
      s !== "custom-tool"
  );
  
  if (hasGeneral && hasAdvertising) {
    return "standard";
  }
  if (hasAdvertising) {
    return "advertising";
  }
  return "standard";
};

export const getOnboardingTypeDisplay = (client: Client): string => {
  if (client.email === "sam@hairtamin.com") {
    return "Custom SEO/AEO Discovery Onboarding";
  }
  const type = getOnboardingType(client);
  switch (type) {
    case "prospect":
      return client.plan === "prospect" ? "Prospect Discovery Onboarding" : "General Discovery Onboarding";
    case "discovery":
      return "Business Admin Onboarding";
    case "amazon":
      return "Amazon Listing Design Onboarding";
    case "advertising":
      return "Advertising Campaign Onboarding";
    case "standard":
      return "Standard Client Onboarding";
    default:
      return "Standard Client Onboarding";
  }
};

export const getRequiredOnboardingForms = (client: Client): string[] => {
  if (client.email === "sam@hairtamin.com") {
    return ["Discovery Questionnaire", "SEO/AEO Discovery"];
  }

  const type = getOnboardingType(client);
  if (type === "prospect") {
    return ["General Discovery Questionnaire"];
  }
  if (type === "discovery") {
    return ["Business Admin Onboarding Questionnaire"];
  }
  if (type === "amazon") {
    return ["Amazon Listing Design Questionnaire"];
  }
  
  const baseForms = ["SMART Goal Sheet", "Customer Avatar Profiles"];
  const services = client.selectedServices || [];
  const hasGeneral = services.some(
    (s: string) =>
      !s.startsWith("channel-") &&
      s !== "advertising-package" &&
      s !== "amazon-design" &&
      s !== "custom-tool"
  );
  const hasAdvertising =
    type === "advertising" ||
    services.includes("advertising-package") ||
    services.some((s: string) => s.startsWith("advertising")) ||
    services.some((s: string) => s.startsWith("channel-"));
  
  if (hasGeneral && hasAdvertising) {
    return [...baseForms, "General Onboarding Questionnaire", "Advertising Campaign Questionnaire"];
  } else if (hasAdvertising) {
    return [...baseForms, "Advertising Campaign Questionnaire"];
  } else {
    return [...baseForms, "General Onboarding Questionnaire"];
  }
};
