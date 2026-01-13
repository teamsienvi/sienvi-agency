
export interface PricingTier {
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  priceId: string;
}

export const pricingTiers: PricingTier[] = [
  {
    title: "Single Service",
    price: "$888",
    description: "Perfect for businesses looking to automate one area of their operations.",
    features: [
      "Full access to one core service",
      "Detailed onboarding process",
      "25% consulting call discount",
      "Monthly performance reports",
      "Dedicated account manager"
    ],
    priceId: "price_1SpFvwDnw1azoLSp17B18jKB"
  },
  {
    title: "Triple Automation",
    price: "$2,398.20",
    description: "Our most popular package for businesses ready to integrate multiple services.",
    features: [
      "Full access to three core services",
      "10% discount on package price",
      "15% consulting call discount",
      "Weekly performance reports",
      "Dedicated account manager",
      "Quarterly strategy sessions"
    ],
    popular: true,
    priceId: "price_1SpFwRDnw1azoLSpuZNVz26s"
  },
  {
    title: "Full Automation",
    price: "$3,996.00",
    description: "The complete solution for businesses ready to fully integrate automation.",
    features: [
      "All six core automation services",
      "25% discount on package price",
      "VIP support with 2-hour response",
      "Bi-weekly performance reports",
      "Dedicated senior account manager",
      "Monthly strategy and optimization reviews"
    ],
    priceId: "price_1SpFwgDnw1azoLSpFNy5x58Z"
  }
];
