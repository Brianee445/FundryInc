'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Container } from '@/app/components/ui/Container';
import { VerificationBadge } from '@/app/components/ui/VerificationBadge';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiGet, apiPost, ApiError } from '@/app/lib/api';
import type { VerificationTier } from '@/app/lib/types/founderProfile';
import type { BillingInterval, CheckoutResponse, PaidTier, SubscriptionStatus } from '@/app/lib/types/billing';

interface TierOption {
  tier: PaidTier;
  label: string;
  color: string; // tailwind arbitrary hex, matches VerificationBadge's palette
  perks: string[];
  monthly: number;
}

// Annual = 10x monthly (2 months free) for every paid tier, both roles.
const TIERS: TierOption[] = [
  {
    tier: 'basic',
    label: 'Basic',
    color: '#F97316',
    perks: ['Extra profile media', 'Basic analytics'],
    monthly: 3000,
  },
  {
    tier: 'premium',
    label: 'Premium',
    color: '#D4AF37',
    perks: ['Everything in Basic', 'Priority placement', 'Full analytics suite'],
    monthly: 5000,
  },
];

function naira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentTier, setCurrentTier] = useState<VerificationTier>('starter');
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<PaidTier>('basic');
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('monthly');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const role = user?.role === 'investor' ? 'investor' : 'founder';
  const profileEndpoint = role === 'investor' ? '/api/v1/investor-profiles/me' : '/api/v1/founder-profiles/me';

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileData, subData] = await Promise.all([
        apiGet<{ verification_tier: VerificationTier }>(profileEndpoint),
        apiGet<SubscriptionStatus>('/api/v1/billing/subscription'),
      ]);
      setCurrentTier(profileData.verification_tier);
      setSubscription(subData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your billing details.');
    } finally {
      setIsLoading(false);
    }
  }, [profileEndpoint]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAll();
    }
  }, [isAuthenticated, user, loadAll]);

  // Bachs redirects back here via return_url/cancel_url. That redirect is
  // UX only — the webhook is what actually grants the tier, and it can
  // land slightly before or after this page does, so we just re-fetch and
  // show a status message either way.
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

  async function handleUpgrade(tier: PaidTier, interval: BillingInterval) {
    setActionLoading(true);
    setError('');
    try {
      const res = await apiPost<CheckoutResponse>('/api/v1/billing/checkout', { tier, interval });
      window.location.href = res.checkout_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout. Please try again.');
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel your subscription? Your current tier stays active until the period ends.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await apiPost('/api/v1/billing/cancel', {});
      setBanner({ tone: 'success', message: 'Your plan is set to cancel — it stays active until the period ends.' });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-secondaryText">Loading...</p>
      </main>
    );
  }

  const isPaid = currentTier !== 'starter';
  const isCanceling = subscription?.status === 'canceled' && isPaid;
  const activeTierOption = TIERS.find((t) => t.tier === currentTier);

  return (
    <main className="min-h-screen bg-background py-10">
      <Container className="max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Billing &amp; Subscription</h1>
            <p className="text-sm text-secondaryText">
              Manage your Fundry verification plan{role === 'investor' ? ' as an investor' : ''}.
            </p>
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
                <VerificationBadge tier={currentTier} />
              </div>
            </div>

            {isPaid && subscription && (
              <div className="text-right text-sm text-secondaryText">
                <p>
                  Billing: <span className="text-primaryText">{subscription.interval === 'annual' ? 'Annual' : 'Monthly'}</span>
                </p>
                <p>
                  {isCanceling ? 'Access ends' : 'Renews'}:{' '}
                  <span className="text-primaryText">{formatDate(subscription.current_period_end)}</span>
                </p>
              </div>
            )}
          </div>

          {isPaid && (
            <div className="mt-5 border-t border-borderColor pt-5">
              {isCanceling ? (
                <p className="text-sm text-secondaryText">
                  Your plan is cancelled and won&apos;t renew. You&apos;ll keep {activeTierOption?.label ?? 'this'} access
                  until the date above.
                </p>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleCancel} disabled={actionLoading}>
                  {actionLoading ? 'Cancelling…' : 'Cancel subscription'}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Plan picker */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-center gap-2">
            {(['monthly', 'annual'] as BillingInterval[]).map((interval) => (
              <button
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  selectedInterval === interval
                    ? 'border-primaryBlue bg-primaryBlue/10 text-primaryBlue'
                    : 'border-borderColor text-secondaryText hover:border-primaryBlue/40'
                }`}
              >
                {interval === 'monthly' ? 'Monthly' : 'Annual (2 months free)'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TIERS.map((option) => {
              const isCurrent = currentTier === option.tier;
              const price = selectedInterval === 'annual' ? option.monthly * 10 : option.monthly;

              return (
                <div
                  key={option.tier}
                  className="rounded-card border p-6"
                  style={{ borderColor: `${option.color}4D`, background: `linear-gradient(to bottom right, ${option.color}0D, transparent)` }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: option.color }} aria-hidden>
                      ✓
                    </span>
                    <h2 className="text-lg font-semibold">{option.label}</h2>
                    {isCurrent && <VerificationBadge tier={option.tier} className="ml-auto" />}
                  </div>

                  <p className="mt-3 text-2xl font-bold text-primaryText">
                    {naira(price)}
                    <span className="text-sm font-normal text-secondaryText">
                      {selectedInterval === 'annual' ? '/yr' : '/mo'}
                    </span>
                  </p>

                  <ul className="mt-4 space-y-1.5 text-sm text-secondaryText">
                    {option.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <span style={{ color: option.color }} aria-hidden>
                          ✓
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="ghost"
                    onClick={() => handleUpgrade(option.tier, selectedInterval)}
                    disabled={actionLoading || isCurrent}
                    className="mt-5 w-full text-white hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: option.color }}
                  >
                    {isCurrent
                      ? 'Current plan'
                      : actionLoading
                        ? 'Redirecting…'
                        : `Upgrade — ${naira(price)}${selectedInterval === 'annual' ? '/yr' : '/mo'}`}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-secondaryText">
            You&apos;ll be redirected to Bachs&apos; secure checkout. Cancel anytime.
          </p>
        </section>

        {error && <p className="mt-4 text-sm text-error">{error}</p>}
      </Container>
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-secondaryText">Loading...</p>
        </main>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
