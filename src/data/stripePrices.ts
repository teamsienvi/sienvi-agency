// Stripe Price IDs (Test Mode)
// These are predefined recurring prices created in Stripe Dashboard

// ============================================
// AUTOMATION BUNDLE PLANS
// ============================================
export const BUNDLE_PRICE_IDS = {
  single: "price_1SpbnaDnw1azoLSpAmnnUwMX",   // $888/mo - Single automation service
  triple: "price_1Spbo0Dnw1azoLSpUgAdICKR",   // $2,664/mo - Triple bundle
  full: "price_1SpboRDnw1azoLSpG07N2lA0",     // $3,996/mo - Full automation suite
} as const;

// ============================================
// INDIVIDUAL SERVICE PRICES
// ============================================
export const SERVICE_PRICE_IDS = {
  // Standard services ($888/mo)
  "custom-website": "price_1SpbnaDnw1azoLSpAmnnUwMX",
  "seo-aeo": "price_1SpbnaDnw1azoLSpAmnnUwMX",
  "custom-ai-assistant": "price_1SpbnaDnw1azoLSpAmnnUwMX",
  
  // Amazon Design Package ($999/mo)
  "amazon-design": "price_1Sq8qQDnw1azoLSpNJgw6Lzd",
  
  // Premium services ($2,450/mo)
  "social-media-suite": "price_1Sq8qrDnw1azoLSpFzRt8BWN",
  "custom-lms": "price_1Sq8r5Dnw1azoLSpQF19zfYf",
} as const;

// ============================================
// ADVERTISING CHANNEL PRICES
// ============================================
// Individual channel: $888/mo each
// Bundle (3+ channels): ~$493/mo each (pro-rated from $3,450 for all 7)
// All 7 channels: $3,450/mo

export const ADVERTISING_PRICE_IDS = {
  // Individual channels ($888/mo each)
  channels: {
    1: "price_1Sq8raDnw1azoLSpX1Channel1",  // 1 channel = $888
    2: "price_1Sq8rbDnw1azoLSpX2Channel2",  // 2 channels = $1,776
  },
  // Bundle pricing (3+ channels)
  bundles: {
    3: "price_1Sq8rcDnw1azoLSpX3Channels",  // 3 channels = $1,479
    4: "price_1Sq8rdDnw1azoLSpX4Channels",  // 4 channels = $1,971
    5: "price_1Sq8reDnw1azoLSpX5Channels",  // 5 channels = $2,464
    6: "price_1Sq8rfDnw1azoLSpX6Channels",  // 6 channels = $2,957
    7: "price_1Sq8rgDnw1azoLSpAllChannels", // 7 channels = $3,450
  },
} as const;

// ============================================
// PRICING CONSTANTS (for display/calculations)
// ============================================
export const PRICING = {
  // Standard automation
  SINGLE_SERVICE: 888,
  TRIPLE_BUNDLE: 2664,
  FULL_SUITE: 3996,
  
  // Special services
  AMAZON_DESIGN: 999,
  PREMIUM_SERVICE: 2450,
  
  // Advertising
  PER_CHANNEL: 888,
  ALL_CHANNELS: 3450,
  CHANNEL_COUNT: 7,
  BUNDLE_THRESHOLD: 3,
  
  get PER_CHANNEL_BUNDLED() {
    return this.ALL_CHANNELS / this.CHANNEL_COUNT;
  },
} as const;

// Helper to get advertising price based on channel count
export const getAdvertisingPriceId = (channelCount: number): string | null => {
  if (channelCount <= 0) return null;
  if (channelCount <= 2) {
    return ADVERTISING_PRICE_IDS.channels[channelCount as 1 | 2];
  }
  if (channelCount >= 7) {
    return ADVERTISING_PRICE_IDS.bundles[7];
  }
  return ADVERTISING_PRICE_IDS.bundles[channelCount as 3 | 4 | 5 | 6];
};

// Helper to calculate advertising cost
export const calculateAdvertisingCost = (channelCount: number): { total: number; savings: number } => {
  if (channelCount <= 0) return { total: 0, savings: 0 };
  
  const baseTotal = channelCount * PRICING.PER_CHANNEL;
  
  if (channelCount < PRICING.BUNDLE_THRESHOLD) {
    return { total: baseTotal, savings: 0 };
  }
  
  const bundledTotal = Math.round(channelCount * PRICING.PER_CHANNEL_BUNDLED);
  return { total: bundledTotal, savings: baseTotal - bundledTotal };
};

// Helper to get service price
export const getServicePrice = (serviceId: string): number => {
  switch (serviceId) {
    case "amazon-design":
      return PRICING.AMAZON_DESIGN;
    case "social-media-suite":
    case "custom-lms":
      return PRICING.PREMIUM_SERVICE;
    default:
      return PRICING.SINGLE_SERVICE;
  }
};
