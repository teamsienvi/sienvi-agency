export interface ActiveSubscriptionItem {
  id: string;
  clientId: string;
  clientName: string;
  label: string;
  amount: number;
  channel: "stripe_automated" | "manual_retainer";
  billingDay?: number | null;
  nextBillingDate?: string | null;
}

export interface CompositionChannel {
  name: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface AttentionQueueItem {
  id: string;
  type: "failed_payment" | "overdue_invoice" | "unsigned_agreement" | "pending_installment" | "overdue_onboarding";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  clientName: string;
  clientId: string;
  amount?: number;
  evidenceTimestamp: string;
  actionLabel: string;
  actionLink: string;
}

export interface ClientHealthCounts {
  total: number;
  active: number;
  onboarding: number;
  pastDue: number;
  pending: number;
  partnership: number;
  canceled: number;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor: string;
  status: "success" | "warning" | "info";
  clientId?: string;
}

export interface CollectedRevenueState {
  status: "verified" | "reconciliation_pending" | "unavailable";
  value: number | null;
  message: string;
}

export interface ExecutiveRevenueMetrics {
  operatingMrr: number;
  stripeMrr: number;
  manualMrr: number;
  pastDueMrr: number;
  pendingMrr: number;
  openInvoicesTotal: number;
  pastDueInvoicesTotal: number;
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  collectedRevenue: CollectedRevenueState;
}

export interface ExecutiveMetricsResponse {
  asOf: string;
  dataFreshness: "realtime" | "cached" | "reconciliation_pending";
  environment: string;
  revenue: ExecutiveRevenueMetrics;
  composition: {
    channels: CompositionChannel[];
    breakdown: ActiveSubscriptionItem[];
  };
  clientHealth: ClientHealthCounts;
  attentionQueue: AttentionQueueItem[];
  recentActivity: ActivityFeedItem[];
}
