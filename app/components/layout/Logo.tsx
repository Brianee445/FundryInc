import Link from 'next/link';
import { cn } from '@/app/lib/utils';

/**
 * Swappable brand mark. Replace the <span> mark below with your SVG logo
 * when it's ready (or an <Image src="/logo/fundry.svg" .../> once that file
 * actually exists in /public) — every page renders through this component.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primaryBlue to-accentCyan text-base font-black text-white">
        F
      </span>
      <span className="text-xl font-bold tracking-tight text-primaryText">Fundry</span>
    </Link>
  );
}
