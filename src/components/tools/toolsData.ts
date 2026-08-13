export interface PlatformTool {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  logoUrl: string;
  redirectUrl: string;
  gradient: string;
  badgeColor: string;
  features: string[];
}

export const platformTools: PlatformTool[] = [
  {
    id: 'billionaire-brother',
    name: 'Billionaire Brother',
    category: 'AI Strategy & Finance',
    tagline: 'Your brother in business',
    description: 'AI-powered revenue diagnosis, path ranking, and transactional sprint planning to maximize margins.',
    logoUrl: '/assets/tools/billionaire-brother-logo.svg',
    redirectUrl: 'https://thebillionairebrother.com/',
    gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    features: ['Revenue Diagnosis', 'Sprint Planning', 'ACoS Calculator'],
  },

  {
    id: 'spendshredder',
    name: 'SpendShredder V2',
    category: 'PPC Automation',
    tagline: 'Amazon advertising optimizer',
    description: 'Amazon PPC optimization engine consuming Search Term Reports and Bulk Sheets to generate enterprise-grade action packs for bidding and placement.',
    logoUrl: '/assets/tools/spendshredder-logo.png',
    redirectUrl: 'https://amazon-shredder-1--shredder-1.us-east4.hosted.app/',
    gradient: 'from-red-500/10 via-orange-500/5 to-transparent',
    badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    features: ['Search Term Reports', 'Bulk Sheet Processing', 'ASIN Pausing'],
  },
  {
    id: 'sienvi-sender',
    name: 'Sienvi Sender',
    category: 'Outbound & Outreach',
    tagline: 'Outbound campaign management',
    description: 'Centralized email campaign outbound tool managing sending domains, reply-to maps, and custom templates for multiple client brands.',
    logoUrl: '/assets/tools/sienvi-sender-logo.svg',
    redirectUrl: 'https://sienvi-sender-test--sienvi-sender.us-east4.hosted.app/',
    gradient: 'from-blue-500/10 via-cyan-500/5 to-transparent',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    features: ['DNS Verification', 'Campaign Sending', 'Dynamic HTML Templates'],
  },
];
