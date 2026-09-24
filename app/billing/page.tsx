'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Container } from '@/app/components/ui/Container';
import { VerificationBadge } from '@/app/components/ui/VerificationBadge';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiGet, apiPost, ApiError } from '@/app/lib/api';
import type { FounderProfile } from '@/app/lib/types/founderProfile';
import type { BillingPlan, CheckoutResponse, SubscriptionStatus } from '@/app/lib/types/billing';

const PRICES: Record<BillingPlan, { label: string; amount: string; note: string }> = {
  monthly: { label: 'Monthly', amount: '₦5,000', note: 'billed every month' },
  annual: { label: 'Annual', amount: '₦48,000', note: 'billed once a year — 2 months free' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<BillingPlan>('monthly');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileData, subData] = await Promise.all([
        apiGet<FounderProfile>('/api/v1/founder-profiles/me'),
        apiGet<SubscriptionStatus>('/api/v1/billing/subscription'),
      ]);
      setProfile(profileData);
      setSubscription(subData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your billing details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== 'founder') {
      // Investors are never billed — nothing for them here.
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'founder') {
      loadAll();
    }
  }, [isAuthenticated, user, loadAll]);

  // Bachs redirects back here (or to /dashboard, depending on config) via
  // return_url/cancel_url. That redirect is UX only — the webhook is what
  // actually grants premium, and it can land slightly before or after this
  // page does, so we just re-fetch and show a status message either way.
  useEffect(() => {
    const billingParam = searchParams.get('billing');
    if (!billingParam) return;

    if (billingParam === 'success') {
      setBanner({ tone: 'success', message: "Payment received — we're finalizing your upgrade." });
      loadAll();
    } else if (billingParam === 'cancelled') {
      setBanner({ tone: 'error', message: 'Checkout was cancelled — no charge was made.' });
    }
  }, [searchParams, loadAll]);

  async function handleUpgrade() {
    setActionLoading(true);
    setError('');
    try {
      const res = await apiPost<CheckoutResponse>('/api/v1/billing/checkout', { plan });
      window.location.href = res.checkout_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout. Please try again.');
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel your Business Verified plan? Your badge stays active until the current period ends.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await apiPost('/api/v1/billing/cancel', {});
      setBanner({ tone: 'success', message: 'Your plan is set to cancel — the badge stays active until the period ends.' });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  if (authLoading || isLoading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-secondaryText">Loading...</p>
      </main>
    );
  }

  const isPremium = profile.verification_tier !== 'basic';
  const isCanceling = subscription?.status === 'canceled' && isPremium;

  return (
    <main className="min-h-screen bg-background py-10">
      <Container className="max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Billing &amp; Subscription</h1>
            <p className="text-sm text-secondaryText">Manage your Fundry verification plan.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Back to dashboard
            </Button>
          </Link>
        </div>

        {banner && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              banner.tone === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-error/30 bg-error/10 text-error'
            }`}
          >
            {banner.message}
          </div>
        )}

        {/* Current status */}
        <section className="rounded-card border border-borderColor bg-cardBg p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-secondaryText">Current plan</p>
              <div className="mt-2">
                <VerificationBadge tier={profile.verification_tier} />
              </div>
            </div>

            {isPremium && subscription && (
              <div className="text-right text-sm text-secondaryText">
                <p>
                  Plan: <span className="text-primaryText">{subscription.plan === 'annual' ? 'Annual' : 'Monthly'}</span>
                </p>
                <p>
                  {isCanceling ? 'Access ends' : 'Renews'}:{' '}
                  <span className="text-primaryText">{formatDate(subscription.current_period_end)}</span>
                </p>
              </div>
            )}
          </div>

          {isPremium && (
            <div className="mt-5 border-t border-borderColor pt-5">
              {isCanceling ? (
                <p className="text-sm text-secondaryText">
                  Your plan is cancelled and won&apos;t renew. You&apos;ll keep the gold badge until the date above.
                </p>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleCancel} disabled={actionLoading}>
                  {actionLoading ? 'Cancelling…' : 'Cancel subscription'}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Upgrade panel — only shown to founders still on Basic */}
        {!isPremium && (
          <section className="mt-6 rounded-card border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-transparent p-6">
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37] text-lg" aria-hidden>
                ✓
              </span>
              <h2 className="text-lg font-semibold">Go Business Verified</h2>
            </div>
            <p className="mt-1 text-sm text-secondaryText">
              A gold verification badge on your profile signals to investors that your startup has been reviewed and
              confirmed — helping you stand out in the directory and in search.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(Object.keys(PRICES) as BillingPlan[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`rounded-xl border p-4 text-left transition ${
                    plan === p
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-borderColor hover:border-[#D4AF37]/40'
                  }`}
                >
                  <p className="text-sm font-semibold text-primaryText">{PRICES[p].label}</p>
                  <p className="mt-1 text-2xl font-bold text-primaryText">{PRICES[p].amount}</p>
                  <p className="mt-1 text-xs text-secondaryText">{PRICES[p].note}</p>
                </button>
              ))}
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="mt-5 w-full bg-[#D4AF37] text-white hover:bg-[#c19d2e]"
            >
              {actionLoading ? 'Redirecting to checkout…' : `Upgrade — ${PRICES[plan].amount}`}
            </Button>

            <p className="mt-3 text-center text-xs text-secondaryText">
              You'll be redirected to Bachs' secure checkout. Cancel anytime.
            </p>
          </section>
        )}

        {error && <p className="mt-4 text-sm text-error">{error}</p>}
      </Container>
    </main>
  );
}
