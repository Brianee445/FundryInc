export type BillingInterval = 'monthly' | 'annual';
export type PaidTier = 'basic' | 'premium';

export interface CheckoutResponse {
  checkout_url: string;
}

export interface SubscriptionStatus {
  verification_tier: string;
  tier: PaidTier | null;
  interval: BillingInterval | null;
  status: 'active' | 'past_due' | 'canceled' | null;
  current_period_end: string | null;
}
