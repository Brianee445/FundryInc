import { cn } from '@/app/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-secondaryBg text-secondaryText border-borderColor',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  error: 'bg-error/10 text-error border-error/30',
  info: 'bg-primaryBlue/10 text-accentCyan border-primaryBlue/30',
};

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
