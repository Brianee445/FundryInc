import type { VerificationTier } from '@/app/lib/types/founderProfile';
import { VERIFICATION_LABELS } from '@/app/lib/types/founderProfile';

interface VerificationBadgeProps {
  tier: VerificationTier;
  className?: string;
  /** Pixel size of the sticker icon. Defaults to 20 (fits inline with text). */
  size?: number;
  /** Hide the text label and render just the sticker icon. */
  iconOnly?: boolean;
}

/**
 * Sticker-style verification badge: a solid-color scalloped seal with a
 * white checkmark, matching the brand's verified-badge artwork (teal for
 * the free "Starter" tier, orange for the paid "Basic" tier, gold for
 * the paid "Premium" tier). Shared by both founder and investor
 * profiles/dashboards, wherever a profile's tier needs to be shown.
 */
const TIER_COLOR: Record<VerificationTier, string> = {
  starter: '#10B981',
  basic: '#F97316',
  premium: '#D4AF37',
};

/** 12-point scalloped seal outline (viewBox 0 0 100 100), traced to match a classic verified-badge sticker shape. */
const SEAL_PATH =
  'M50 2 L61 10 L74 6 L79 19 L93 21 L91 35 L100 46 L90 56 L94 70 L80 74 L77 88 L63 86 L52 96 L41 86 L27 88 L24 74 L10 70 L14 56 L4 46 L13 35 L11 21 L25 19 L30 6 L43 10 Z';

export function VerificationBadge({ tier, className, size = 20, iconOnly = false }: VerificationBadgeProps) {
  const color = TIER_COLOR[tier];

  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={!iconOnly}
      role={iconOnly ? 'img' : undefined}
      aria-label={iconOnly ? VERIFICATION_LABELS[tier] : undefined}
      className="shrink-0"
    >
      <path d={SEAL_PATH} fill={color} />
      <path
        d="M32 51 L44 63 L69 36"
        stroke="white"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (iconOnly) {
    return <span className={className}>{icon}</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${className ?? ''}`}
      style={{ color, borderColor: `${color}4D`, backgroundColor: `${color}1A` }}
    >
      {icon}
      {VERIFICATION_LABELS[tier]}
    </span>
  );
}
