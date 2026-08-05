// app/components/layout/Logo.tsx
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/app/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center', className)}>
      <Image
        src="/logo/fundry.png"
        alt="Fundry"
        width={128}
        height={64}
        priority
        className="h-9 w-auto"
      />
    </Link>
  );
}
