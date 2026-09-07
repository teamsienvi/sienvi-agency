export interface UgcVideoItem {
  id: string;
  title: string;
  category: "oxisure_tech" | "blingy_bag" | "snarky_pets";
  badge: string;
  badgeColor: string;
  creatorName: string;
  creatorArchetype: string;
  creatorDemographic: string;
  videoUrl: string;
  posterUrl?: string;
  hookAngle: string;
  hookFramework: string;
  scriptHookQuote: string;
  scriptAgitationQuote: string;
  scriptCtaQuote: string;
  targetEngines: string[];
  performanceMetrics: {
    conversionLift: string;
    roas: string;
    ctr: string;
    turnaround: string;
  };
  productName: string;
  inquiryLabel: string;
}

export const ugcVideos: UgcVideoItem[] = [
  {
    id: "oxisure-tech-ugc",
    title: "Continuous Airflow & Kink-Resistant Protection",
    category: "oxisure_tech",
    badge: "Oxisure Tech • Medical UGC",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    creatorName: "Caregiver & Respiratory Advocate",
    creatorArchetype: "Direct-Response Healthcare & Patient Voice",
    creatorDemographic: "Home Health & Caregiver Demographic (Age 40–55)",
    videoUrl: "/assets/videos/oxisure-tech-ugc.mp4",
    hookAngle: "Preventing nighttime line bends, tripping hazards, and sudden oxygen cutoff",
    hookFramework: "Problem • Agitate • Relatable Medical Solution",
    scriptHookQuote: "If you or a loved one depends on supplemental oxygen, you know how terrifying a sudden kink in the tubing can be in the middle of the night.",
    scriptAgitationQuote: "Standard tubing bends and snags under chair wheels without warning. Oxisure Tech's star-lumen interior ensures continuous airflow and kink resistance even under heavy pressure.",
    scriptCtaQuote: "Give your family uninterrupted breathing peace of mind. Check out Oxisure Tech on Amazon and our official store.",
    targetEngines: ["Direct-Response Video", "Scripted UGC Voice", "Multi-Angle Demonstration"],
    performanceMetrics: {
      conversionLift: "10.4x Conversion Lift",
      roas: "4.8x Amazon Ad ROAS",
      ctr: "4.3% Click-Through Rate",
      turnaround: "Proven Conversion Winner",
    },
    productName: "Oxisure Tech Star-Lumen Oxygen Tubing",
    inquiryLabel: "Healthcare & Medical UGC",
  },
  {
    id: "blingy-bag-ugc",
    title: "Street Outfit Check: Guess The Handbag Price",
    category: "blingy_bag",
    badge: "Blingy Bag • Street Interview",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    creatorName: "Urban Street Style Host",
    creatorArchetype: "High-Energy Street Interviewer & Trend Curator",
    creatorDemographic: "Modern Lifestyle & Fashion Demographic (Age 22–32)",
    videoUrl: "/assets/videos/blingy-bag-ugc.mp4",
    hookAngle: "Sidewalk interview outfit check: Guessing real luxury bag prices vs direct retail",
    hookFramework: "Street Interview / Viral Curiosity & Price Reveal",
    scriptHookQuote: "Excuse me! We're on the street rating today's outfit—quick question: How much do you think this handbag costs?",
    scriptAgitationQuote: "Everyone guesses $300 to $500 because of the custom hardware and premium vegan leather, but when they hear it's under $70 with a lifetime warranty, people go wild.",
    scriptCtaQuote: "Upgrade your everyday drip without the luxury markup. Tap the link below to shop the newest Blingy Bag drop.",
    targetEngines: ["Google Flow UGC", "Live Ambient Street Engine", "Dynamic Kinetic Subtitles"],
    performanceMetrics: {
      conversionLift: "+180% Engagement Surge",
      roas: "5.2x Paid Social ROAS",
      ctr: "6.1% Outbound CTR",
      turnaround: "August 2026 Flow Batch",
    },
    productName: "Blingy Bag Luxury Everyday Handbag Collection",
    inquiryLabel: "E-Commerce & Fashion UGC",
  },
  {
    id: "snarky-pets-ugc",
    title: "Melcat On The Street: Unfiltered Pet Owner Roast",
    category: "snarky_pets",
    badge: "Snarky Pets • Brand Mascot UGC",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    creatorName: "Melcat (AI Mascot Twin)",
    creatorArchetype: "Snarky Brand Mascot & Street Roving Reporter",
    creatorDemographic: "AI Mascot Persona & Pet Parent Community",
    videoUrl: "/assets/videos/snarky-pets-ugc.mp4",
    hookAngle: "Melcat hits the street with a microphone roasting pet owners about their dogs and cats",
    hookFramework: "AI Mascot Street Interview / Viral Humorous Roast",
    scriptHookQuote: "Excuse me, sir! Quick question for your dog: Why does he ignore the $200 orthopedic bed you bought and sleep on your clean laundry instead?",
    scriptAgitationQuote: "Pet owners spend thousands pretending they're the boss. Melcat gives your pets the hilarious, sarcastic voice they've actually been thinking the whole time.",
    scriptCtaQuote: "Follow Snarky Pets for daily animal sarcasm and check out our full collection at snarkypets.com.",
    targetEngines: ["Google Flow UGC", "AI Character Voice Synthesis", "Photorealistic Kinetic Motion"],
    performanceMetrics: {
      conversionLift: "+92% Audience Retention",
      roas: "4.7x TikTok & Reels ROAS",
      ctr: "7.4% Organic Viral CTR",
      turnaround: "August 2026 Flow Batch",
    },
    productName: "Snarky Pets Apparel & Accessory Line",
    inquiryLabel: "Entertainment & Brand Mascot UGC",
  },
];
