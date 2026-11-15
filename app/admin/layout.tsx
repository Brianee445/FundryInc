import type { ReactNode } from 'react';

export const metadata = { title: 'Admin · Fundry', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
