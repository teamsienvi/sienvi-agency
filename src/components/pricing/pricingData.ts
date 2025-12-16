
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
    title: "Website + SEO Starter",
    price: "$1,776/mo",
    description: "Perfect for businesses launching their online presence with built-in SEO.",
    features: [
      "Website Buildout Package",
      "SEO/AEO Package included",
      "3-month minimum contract",
      "Monthly performance reports",
      "Dedicated account manager"
    ],
    note: "Save $0 - Best value for new sites"
  },
  {
    title: "Growth Package",
    price: "$2,398/mo",
    description: "Our most popular package combining web presence with social media.",
    features: [
      "Website Buildout Package",
      "SEO/AEO Package",
      "Social Media Suite",
      "10% bundle discount applied",
      "Weekly performance reports",
      "Quarterly strategy sessions"
    ],
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
    price: "$1,500 setup + $299/mo support",
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
