export interface UgcVideoItem {
  id: string;
  title: string;
  category: "founder_twin" | "customer_fleet" | "high_volume_ads" | "product_demo";
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
    id: "founder-twin-fatigue",
    title: "The Afternoon Fatigue Coffee Trap",
    category: "founder_twin",
    badge: "Foundry Founder Twin",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    creatorName: "Dr. Wendy Myers",
    creatorArchetype: "Clinical Detox Expert & Founder Authority Twin",
    creatorDemographic: "Seed-Locked Authority Avatar (Age 45–50)",
    videoUrl: "/assets/videos/ugc_demo_1.mp4",
    hookAngle: "Why your 2 PM coffee creates heart palpitations instead of focus",
    hookFramework: "PAS (Problem • Agitate • Solution)",
    scriptHookQuote: "If your afternoon coffee gives you heart palpitations instead of energy, listen up. It's usually not your sleep—it's heavy metal cellular traffic.",
    scriptAgitationQuote: "Toxic metals attach to your cells and choke off ATP energy production. You don't need another espresso; you need a clinical citrus pectin binder to physically trap and clear the jam.",
    scriptCtaQuote: "Tap below to take the 2-minute Toxic Load Quiz and try CitriCleanse today.",
    targetEngines: ["Kling AI v1.5", "LivePortrait", "ElevenLabs Voice Twin"],
    performanceMetrics: {
      conversionLift: "10.38x Conversion Lift",
      roas: "4.6x Verified ROAS",
      ctr: "3.82% Hook-to-Click",
      turnaround: "24h Turnaround",
    },
    productName: "CitriCleanse Modified Citrus Pectin",
    inquiryLabel: "Founder Twin Engine",
  },
  {
    id: "persona-fleet-mom-routine",
    title: "Why My 3 PM Brain Fog Vanished",
    category: "customer_fleet",
    badge: "Multi-Persona Fleet",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    creatorName: "Sarah Miller",
    creatorArchetype: "Everyday Working Mom / Kitchen Lifestyle Avatar",
    creatorDemographic: "Relatable Consumer Demographic (Age 36–42)",
    videoUrl: "/assets/videos/ugc_demo_2.mp4",
    hookAngle: "Kitchen morning routine & instant afternoon stamina recovery",
    hookFramework: "Morning Routine / Relatable Objection Buster",
    scriptHookQuote: "I used to crash so hard at 3 PM that I couldn't help my kids with homework without a second shot of espresso.",
    scriptAgitationQuote: "My doctor said my labs were normal, but my cellular toxicity was through the roof from everyday micro-exposures. 6 golden drops in my morning lemon water changed everything in 48 hours.",
    scriptCtaQuote: "Stop running on fumes. Tap below to see how CitriCleanse clears cellular fatigue.",
    targetEngines: ["Runway Gen-3 Alpha", "LivePortrait", "ElevenLabs"],
    performanceMetrics: {
      conversionLift: "+73% Customer Trust",
      roas: "3.9x Top-of-Funnel ROAS",
      ctr: "4.15% Video CTR",
      turnaround: "36h Fleet Turnaround",
    },
    productName: "Cellular Daily Energy Drops",
    inquiryLabel: "Customer Persona Fleets",
  },
  {
    id: "high-volume-pas-ad",
    title: "3 Reasons Coffee Is Wrecking Your Adrenals",
    category: "high_volume_ads",
    badge: "High-Volume UGC Ad",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    creatorName: "Alex Rivera",
    creatorArchetype: "High-Energy Fitness & Longevity Coach",
    creatorDemographic: "Athletic Performance Persona (Age 28–34)",
    videoUrl: "/assets/videos/ugc_demo_3.mp4",
    hookAngle: "Adrenal burnout & mitochondrial blockages vs clean binders",
    hookFramework: "'3 Reasons Why' PAS Video Ad",
    scriptHookQuote: "Stop drinking pre-workout on an empty stomach. Here are 3 reasons your adrenals are completely exhausted.",
    scriptAgitationQuote: "Reason 1: Cortisol spikes before 10 AM wreck deep sleep. Reason 2: Synthetic caffeine doesn't cross mitochondrial barriers without binders. Reason 3: Heavy metals block cellular ATP.",
    scriptCtaQuote: "Switch to clean cellular hydration today. Claim 20% off your initial pilot kit below.",
    targetEngines: ["Kling AI v1.5", "Hailuo AI / Minimax", "Hedra Lip-Sync"],
    performanceMetrics: {
      conversionLift: "4.1x Higher Engagement",
      roas: "5.2x Paid Social ROAS",
      ctr: "5.1% Outbound CTR",
      turnaround: "48h Rapid Scaling",
    },
    productName: "Performance Cellular Hydration",
    inquiryLabel: "High-Volume UGC Ads",
  },
  {
    id: "kinetic-macro-demo",
    title: "The Clinical Macro Dropper Swirl",
    category: "product_demo",
    badge: "Kinetic Product Demo",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    creatorName: "Sensory Macro Studio",
    creatorArchetype: "Formulation Science & Physical Product Action Avatar",
    creatorDemographic: "Macro Studio Close-Up (Sensory Visual ASMR)",
    videoUrl: "/assets/videos/ugc_demo_1.mp4",
    hookAngle: "Physical binder action swirl into water with macro dropper close-up",
    hookFramework: "Visual ASMR & Instant Physical Demonstration",
    scriptHookQuote: "Watch what happens when modified citrus pectin meets water. It forms a microscopic cage that attracts toxic heavy metals like a magnet.",
    scriptAgitationQuote: "Most cleanses strip essential magnesium and zinc from your bloodstream. This clinical matrix exclusively binds lead, mercury, and arsenic without touching vital minerals.",
    scriptCtaQuote: "Review our third-party clinical lab reports and get your starter bottle today.",
    targetEngines: ["Kling AI High-Def", "ComfyUI Multi-ControlNet", "Sound Design Suite"],
    performanceMetrics: {
      conversionLift: "+8.7x Product Page Lift",
      roas: "4.1x Retargeting ROAS",
      ctr: "3.4% Retargeting CTR",
      turnaround: "24h Turnaround",
    },
    productName: "CitriCleanse Micro-Dropper Bottle",
    inquiryLabel: "Kinetic Macro Demo",
  },
];
