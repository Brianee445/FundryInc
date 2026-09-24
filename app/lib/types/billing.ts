export type BillingPlan = 'monthly' | 'annual';

export interface CheckoutResponse {
  checkout_url: string;
}

export interface SubscriptionStatus {
  verification_tier: string;
  plan: BillingPlan | null;
  status: 'active' | 'past_due' | 'canceled' | null;
  current_period_end: string | null;
}
