import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/app/lib/utils';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Fundry – Connect Founders with Investors',
  description: 'Connecting visionary founders with serious investors. Raise capital, build the future.',
};

// Runs before React hydrates so the correct theme class is on <html> for
// the very first paint — without this, the page would flash dark (or
// light) for a frame on every load before ThemeProvider's effect runs.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('fundry_theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={cn('overflow-x-hidden bg-background text-primaryText antialiased')}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
