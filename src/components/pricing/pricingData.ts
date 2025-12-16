
export interface PricingTier {
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  note?: string;
}

export const pricingTiers: PricingTier[] = [
  {
    title: "Website + Custom GPT",
    price: "$888 x 3 months + GPT (TBD)",
    description: "Professional website with AI-powered chatbot for your business.",
    features: [
      "Website Buildout Package (3-month contract)",
      "Custom GPT Product included",
      "AI chatbot trained on your business",
      "Monthly performance reports",
      "Dedicated account manager"
    ],
    note: "Custom GPT setup fee + monthly support TBD"
  },
  {
    title: "SEO/AEO + Custom GPT",
    price: "$888 x 2 months",
    description: "Boost visibility and automate customer interactions.",
    features: [
      "SEO/AEO Package",
      "Custom GPT Product included",
      "Search & AI engine optimization",
      "AI chatbot for lead capture",
      "Monthly ranking reports"
    ],
    note: "Optional combo package",
    popular: true
  },
  {
    title: "Full Digital Suite",
    price: "$3,996/mo",
    description: "Complete solution for businesses ready to dominate digitally.",
    features: [
      "Website Buildout + SEO/AEO",
      "Social Media Suite",
      "Custom GPT Product (setup included)",
      "E-Commerce Operations",
      "25% bundle discount",
      "VIP support with 2-hour response"
    ]
  }
];

// Standalone service pricing
export const standalonePricing = [
  {
    title: "Website Buildout",
    price: "$888/mo",
    note: "3-month contract"
  },
  {
    title: "SEO/AEO Package",
    price: "$888/mo",
    note: "Available standalone"
  },
  {
    title: "Social Media Suite",
    price: "$888/mo",
    note: "All-in-one social management"
  },
  {
    title: "Custom GPT Product",
    price: "TBD",
    note: "Great for client upsells"
  },
  {
    title: "Custom LMS Package",
    price: "$2,500 setup + $499/mo support",
    note: "Full learning platform"
  },
  {
    title: "E-Commerce Operations",
    price: "$888/mo",
    note: "Multi-channel automation"
  }
];
