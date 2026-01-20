export interface AdvertisingChannel {
  id: string;
  name: string;
  shortDescription: string;
  sections: {
    title: string;
    items: string[];
  }[];
}

export const advertisingChannels: AdvertisingChannel[] = [
  {
    id: "amazon",
    name: "Amazon Advertising Management",
    shortDescription: "Sponsored Products, Brands, Display, and DSP campaigns optimized for visibility and profitability.",
    sections: [
      {
        title: "Account & Tracking Foundation",
        items: [
          "Amazon Ads account setup and configuration",
          "Brand Registry and Store integration",
          "Attribution and reporting setup",
        ],
      },
      {
        title: "Strategy & Planning",
        items: [
          "Campaign architecture and structure planning",
          "Budget allocation across campaign types",
          "Competitive positioning analysis",
        ],
      },
      {
        title: "Research & Targeting",
        items: [
          "Keyword research and harvesting",
          "ASIN targeting identification",
          "Audience segment analysis",
        ],
      },
      {
        title: "Campaign Build & Setup",
        items: [
          "Sponsored Products, Brands, and Display campaigns",
          "Automatic and manual campaign structures",
          "Negative targeting implementation",
        ],
      },
      {
        title: "Creative & Assets",
        items: [
          "Sponsored Brand creative development",
          "Store spotlight and video ad assets",
          "A+ Content alignment",
        ],
      },
      {
        title: "Optimization & Management",
        items: [
          "Bid optimization and adjustment",
          "Search term analysis and refinement",
          "Budget pacing and reallocation",
        ],
      },
      {
        title: "Reporting & Communication",
        items: [
          "Weekly performance reports",
          "Monthly strategy reviews",
          "Quarterly planning sessions",
        ],
      },
      {
        title: "Compliance & Account Safety",
        items: [
          "Policy compliance monitoring",
          "Brand safety management",
          "Account health maintenance",
        ],
      },
    ],
  },
  {
    id: "google",
    name: "Google Ads Management",
    shortDescription: "Search, Display, Shopping, and Performance Max campaigns across the Google ecosystem.",
    sections: [
      {
        title: "Account & Tracking Foundation",
        items: [
          "Google Ads account setup and structure",
          "Conversion tracking implementation",
          "Google Analytics 4 integration",
        ],
      },
      {
        title: "Strategy & Planning",
        items: [
          "Campaign type selection and structure",
          "Budget distribution strategy",
          "Competitive landscape analysis",
        ],
      },
      {
        title: "Research & Targeting",
        items: [
          "Keyword research and match type strategy",
          "Audience segment creation",
          "Placement and topic targeting",
        ],
      },
      {
        title: "Campaign Build & Setup",
        items: [
          "Search, Display, and Shopping campaigns",
          "Performance Max configuration",
          "Remarketing list setup",
        ],
      },
      {
        title: "Creative & Assets",
        items: [
          "Ad copy development and testing",
          "Responsive ad asset creation",
          "Landing page alignment review",
        ],
      },
      {
        title: "Optimization & Management",
        items: [
          "Bid strategy optimization",
          "Quality Score improvement",
          "Search query analysis and refinement",
        ],
      },
      {
        title: "Reporting & Communication",
        items: [
          "Weekly performance dashboards",
          "Monthly trend analysis",
          "Strategic recommendation updates",
        ],
      },
      {
        title: "Compliance & Account Safety",
        items: [
          "Policy compliance checks",
          "Ad disapproval resolution",
          "Account suspension prevention",
        ],
      },
    ],
  },
  {
    id: "meta",
    name: "Meta Ads Management",
    shortDescription: "Facebook and Instagram advertising with full-funnel campaign strategies.",
    sections: [
      {
        title: "Account & Tracking Foundation",
        items: [
          "Business Manager and Ads Manager setup",
          "Meta Pixel and Conversions API implementation",
          "Event tracking configuration",
        ],
      },
      {
        title: "Strategy & Planning",
        items: [
          "Full-funnel campaign architecture",
          "Budget allocation by objective",
          "Audience strategy development",
        ],
      },
      {
        title: "Research & Targeting",
        items: [
          "Custom audience creation",
          "Lookalike audience development",
          "Interest and behavior targeting",
        ],
      },
      {
        title: "Campaign Build & Setup",
        items: [
          "Awareness, consideration, and conversion campaigns",
          "Dynamic product ads configuration",
          "Advantage+ campaign setup",
        ],
      },
      {
        title: "Creative & Assets",
        items: [
          "Ad creative strategy and concepts",
          "Copy variations and hooks",
          "Creative testing frameworks",
        ],
      },
      {
        title: "Optimization & Management",
        items: [
          "Creative performance analysis",
          "Audience refinement and scaling",
          "Placement and delivery optimization",
        ],
      },
      {
        title: "Reporting & Communication",
        items: [
          "Weekly performance summaries",
          "Creative performance insights",
          "Monthly strategic reviews",
        ],
      },
      {
        title: "Compliance & Account Safety",
        items: [
          "Ad policy compliance",
          "Account quality monitoring",
          "Business verification management",
        ],
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok Advertising Management",
    shortDescription: "In-feed ads, Spark Ads, and TopView campaigns for engaged audiences.",
    sections: [
      {
        title: "Account & Tracking Foundation",
        items: [
          "TikTok Ads Manager setup",
          "Pixel and Events API implementation",
          "Attribution window configuration",
        ],
      },
      {
        title: "Strategy & Planning",
        items: [
          "Campaign objective alignment",
          "Content-first strategy development",
          "Budget pacing and scaling plans",
        ],
      },
      {
        title: "Research & Targeting",
        items: [
          "Audience interest research",
          "Behavioral targeting setup",
          "Creator and hashtag analysis",
        ],
      },
      {
        title: "Campaign Build & Setup",
        items: [
          "In-feed and Spark Ads campaigns",
          "Smart Performance campaigns",
          "Catalog and dynamic ads",
        ],
      },
      {
        title: "Creative & Assets",
        items: [
          "Native content strategy",
          "Trend alignment and hooks",
          "Creator partnership coordination",
        ],
      },
      {
        title: "Optimization & Management",
        items: [
          "Creative refresh and rotation",
          "Audience expansion and refinement",
          "Bid and budget optimization",
        ],
      },
      {
        title: "Reporting & Communication",
        items: [
          "Weekly engagement reports",
          "Creative performance insights",
          "Monthly trend analysis",
        ],
      },
      {
        title: "Compliance & Account Safety",
        items: [
          "Content policy adherence",
          "Community guidelines compliance",
          "Account standing management",
        ],
      },
    ],
  },
  {
    id: "youtube",
    name: "YouTube Ads Management",
    shortDescription: "Skippable, non-skippable, and Discovery ads for video-first campaigns.",
    sections: [
      {
        title: "Account & Tracking Foundation",
        items: [
          "Google Ads video campaign setup",
          "YouTube channel linking",
          "Conversion tracking integration",
        ],
      },
      {
        title: "Strategy & Planning",
        items: [
          "Video campaign objective mapping",
          "Funnel stage alignment",
          "Budget and bid strategy planning",
        ],
      },
      {
        title: "Research & Targeting",
        items: [
          "Placement and channel targeting",
          "In-market and affinity audiences",
          "Custom intent audience creation",
        ],
      },
      {
        title: "Campaign Build & Setup",
        items: [
          "Skippable and non-skippable ads",
          "Discovery and Shorts campaigns",
          "Video action campaigns",
        ],
      },
      {
        title: "Creative & Assets",
        items: [
          "Video ad creative guidance",
          "Thumbnail and companion asset creation",
          "CTA and end screen optimization",
        ],
      },
      {
        title: "Optimization & Management",
        items: [
          "View rate and CPV optimization",
          "Audience performance analysis",
          "Frequency capping management",
        ],
      },
      {
        title: "Reporting & Communication",
        items: [
          "Weekly video performance reports",
          "Audience engagement insights",
          "Monthly strategy updates",
        ],
      },
      {
        title: "Compliance & Account Safety",
        items: [
          "Ad suitability settings",
          "Brand safety inventory controls",
          "Content policy compliance",
        ],
      },
    ],
  },
  {
    id: "reddit",
    name: "Reddit Advertising Management",
    shortDescription: "Community-focused promoted posts and conversation ads for niche audiences.",
    sections: [
      {
        title: "Account & Tracking Foundation",
        items: [
          "Reddit Ads account setup",
          "Reddit Pixel implementation",
          "Conversion event configuration",
        ],
      },
      {
        title: "Strategy & Planning",
        items: [
          "Community and subreddit strategy",
          "Campaign objective alignment",
          "Budget and pacing framework",
        ],
      },
      {
        title: "Research & Targeting",
        items: [
          "Subreddit and community research",
          "Interest and keyword targeting",
          "Audience behavior analysis",
        ],
      },
      {
        title: "Campaign Build & Setup",
        items: [
          "Promoted posts and conversation ads",
          "Traffic and conversion campaigns",
          "Remarketing configuration",
        ],
      },
      {
        title: "Creative & Assets",
        items: [
          "Native-style ad copy",
          "Community-appropriate messaging",
          "Visual asset development",
        ],
      },
      {
        title: "Optimization & Management",
        items: [
          "Engagement rate optimization",
          "Community performance analysis",
          "Bid and placement adjustments",
        ],
      },
      {
        title: "Reporting & Communication",
        items: [
          "Weekly community insights",
          "Engagement and sentiment analysis",
          "Monthly performance reviews",
        ],
      },
      {
        title: "Compliance & Account Safety",
        items: [
          "Community guidelines adherence",
          "Ad policy compliance",
          "Brand reputation management",
        ],
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn Advertising Management",
    shortDescription: "Sponsored content, InMail, and lead gen forms for B2B audiences.",
    sections: [
      {
        title: "Account & Tracking Foundation",
        items: [
          "LinkedIn Campaign Manager setup",
          "Insight Tag implementation",
          "Conversion tracking configuration",
        ],
      },
      {
        title: "Strategy & Planning",
        items: [
          "B2B funnel campaign architecture",
          "Account-based marketing alignment",
          "Budget allocation by objective",
        ],
      },
      {
        title: "Research & Targeting",
        items: [
          "Company and industry targeting",
          "Job title and seniority filters",
          "Matched audience creation",
        ],
      },
      {
        title: "Campaign Build & Setup",
        items: [
          "Sponsored content and InMail campaigns",
          "Lead gen form setup",
          "Document and video ads",
        ],
      },
      {
        title: "Creative & Assets",
        items: [
          "Professional ad copy development",
          "Carousel and video creative",
          "Lead magnet alignment",
        ],
      },
      {
        title: "Optimization & Management",
        items: [
          "Audience refinement and expansion",
          "Creative performance testing",
          "Lead quality analysis",
        ],
      },
      {
        title: "Reporting & Communication",
        items: [
          "Weekly lead and engagement reports",
          "Cost per lead analysis",
          "Monthly strategic reviews",
        ],
      },
      {
        title: "Compliance & Account Safety",
        items: [
          "Ad policy compliance",
          "Professional content guidelines",
          "Account quality maintenance",
        ],
      },
    ],
  },
];
