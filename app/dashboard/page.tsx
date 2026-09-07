'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Container } from '@/app/components/ui/Container';
import { useAuth } from '@/app/providers/AuthProvider';
import { FounderDashboard } from '@/app/components/dashboard/FounderDashboard';
import { InvestorDashboard } from '@/app/components/dashboard/InvestorDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading || !user) {
    // Covers both the initial session check and the brief window before the
    // redirect above fires — never render authenticated content until we're
    // sure there's a session.
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-secondaryText">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <Container className="max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {user.role === 'founder' ? 'Founder Dashboard' : 'Investor Dashboard'}
            </h1>
            <p className="text-sm text-secondaryText">{user.email}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Log Out
          </Button>
        </div>

        {user.role === 'founder' && <FounderDashboard />}
        {user.role === 'investor' && <InvestorDashboard />}
        {user.role === 'admin' && (
          <div className="rounded-card border border-borderColor bg-cardBg p-8 text-secondaryText">
            The admin panel hasn&apos;t been built yet — it&apos;s a separate piece of the PRD (user
            management, verification review, content moderation).
          </div>
        )}
      </Container>
    </main>
  );
}
