import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/app/lib/utils';
import { AuthProvider } from '@/app/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'Fundry – Connect Founders with Investors',
  description: 'Connecting visionary founders with serious investors. Raise capital, build the future.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn('overflow-x-hidden bg-background text-primaryText antialiased')}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
