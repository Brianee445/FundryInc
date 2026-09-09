'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Container } from '@/app/components/ui/Container';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';
import { useAuth } from '@/app/providers/AuthProvider';
import { MessagesInbox } from '@/app/components/messages/MessagesInbox';

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-secondaryText">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <Container className="max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm text-secondaryText hover:text-primaryText">
                ← Dashboard
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-bold">Messages</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>

        <MessagesInbox initialConnectionId={searchParams.get('connection') ?? undefined} />
      </Container>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-secondaryText">Loading...</p>
        </main>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
