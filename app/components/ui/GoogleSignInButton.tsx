'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal shape of the Google Identity Services API used here — the full
// library ships its own (much larger) type definitions, which isn't worth
// pulling in for a single button.
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

interface GoogleSignInButtonProps {
  /** Called with the Google ID token once the person picks an account. */
  onCredential: (idToken: string) => void;
  /** Disables the button without unmounting it (e.g. until a role is picked on signup). */
  disabled?: boolean;
  disabledHint?: string;
}

export function GoogleSignInButton({ onCredential, disabled, disabledHint }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback((idToken: string) => onCredential(idToken), [onCredential]);

  // Re-runs whenever the script finishes loading OR `disabled` flips to
  // false (e.g. the signup page enables this once a role is selected) —
  // either case can be the moment the button first becomes renderable.
  useEffect(() => {
    if (disabled || !clientId || !scriptLoaded || !containerRef.current || !window.google) return;

    // Clear any previous render before re-rendering, since renderButton()
    // appends rather than replaces.
    containerRef.current.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => handleCredential(response.credential),
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      width: '360',
      text: 'continue_with',
    });
  }, [disabled, clientId, scriptLoaded, handleCredential]);

  if (!clientId) {
    // Fails loud in development so a missing env var doesn't look like a
    // silently broken button; in production this should never render.
    return process.env.NODE_ENV === 'development' ? (
      <p className="text-sm text-error">NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.</p>
    ) : null;
  }

  return (
    <div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} className={disabled ? 'pointer-events-none opacity-40' : ''} aria-disabled={disabled} />
      {disabled && disabledHint && <p className="mt-2 text-center text-xs text-secondaryText">{disabledHint}</p>}
    </div>
  );
}
