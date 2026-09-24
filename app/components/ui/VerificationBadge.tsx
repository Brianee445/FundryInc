import type { VerificationTier } from '@/app/lib/types/founderProfile';
import { VERIFICATION_LABELS } from '@/app/lib/types/founderProfile';

interface VerificationBadgeProps {
  tier: VerificationTier;
  className?: string;
}

/**
 * Color-coded verification badge: teal for the free "Basic" tier, gold
 * for the paid tiers ("Business Verified" / "Investor-Ready"). Distinct
 * from the generic <Badge tone="info"> used elsewhere — this one carries
 * meaning about paid status, so it gets its own fixed palette rather than
 * the theme's semantic tones.
 */
const TIER_STYLES: Record<VerificationTier, string> = {
  basic: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30',
  business_verified: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40',
  investor_ready: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40',
};

const TIER_ICON: Record<VerificationTier, string> = {
  basic: '✓',
  business_verified: '✓',
  investor_ready: '✓',
};

export function VerificationBadge({ tier, className }: VerificationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${TIER_STYLES[tier]} ${className ?? ''}`}
    >
      <span aria-hidden>{TIER_ICON[tier]}</span>
      {VERIFICATION_LABELS[tier]}
    </span>
  );
}
