'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'fundry_admin_token';

interface Summary {
  total: number;
  notified: number;
  pending: number;
  next_batch: number;
  max_per_send: number;
  gemini_configured: boolean;
  resend_configured: boolean;
}

interface SendResult {
  sent: number;
  remaining: number;
  subject: string;
  body: string;
  used_fallback: boolean;
}

class AdminAuthError extends Error {}

async function adminFetch<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : undefined;
  if (!res.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : res.statusText || 'Request failed';
    if (res.status === 401 && token) throw new AdminAuthError(detail);
    throw new Error(detail);
  }
  return data as T;
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SendResult | null>(null);

  const logout = useCallback((message = '') => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSummary(null);
    setResult(null);
    setLoginError(message);
  }, []);

  const loadSummary = useCallback(
    async (t: string) => {
      try {
        setSummary(await adminFetch<Summary>('/api/v1/admin/waitlist/summary', t));
      } catch (err) {
        if (err instanceof AdminAuthError) logout(err.message);
        else setError(err instanceof Error ? err.message : 'Could not load waitlist stats.');
      }
    },
    [logout]
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      loadSummary(stored);
    }
    setReady(true);
  }, [loadSummary]);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const data = await adminFetch<{ token: string }>('/api/v1/admin/login', null, {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      });
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPasscode('');
      loadSummary(data.token);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onSend = async () => {
    if (!token || !summary) return;
    if (!window.confirm(`Draft with Gemini and send the launch email to ${summary.next_batch} people now?`)) return;
    setError('');
    setResult(null);
    setIsSending(true);
    try {
      const data = await adminFetch<SendResult>('/api/v1/admin/waitlist/send-launch', token, { method: 'POST' });
      setResult(data);
      loadSummary(token);
    } catch (err) {
      if (err instanceof AdminAuthError) logout(err.message);
      else setError(err instanceof Error ? err.message : 'Send failed.');
    } finally {
      setIsSending(false);
    }
  };

  if (!ready) return null;

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <form onSubmit={onLogin} className="w-full space-y-4 rounded-card border border-borderColor bg-cardBg p-8">
          <h1 className="text-2xl font-bold">Admin access</h1>
          {loginError && (
            <div className="rounded-[14px] border border-error bg-error/10 p-3 text-sm text-error">{loginError}</div>
          )}
          <Input
            type="password"
            placeholder="Passcode"
            autoComplete="off"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
          <Button type="submit" disabled={isLoggingIn || !passcode}>
            {isLoggingIn ? 'Checking...' : 'Enter'}
          </Button>
        </form>
      </main>
    );
  }

  const notReady = summary && (!summary.gemini_configured || !summary.resend_configured);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Waitlist launch email</h1>
        <Button size="sm" variant="secondary" onClick={() => logout()}>
          Log out
        </Button>
      </div>

      {error && <div className="rounded-[14px] border border-error bg-error/10 p-4 text-sm text-error">{error}</div>}

      {summary && (
        <section className="space-y-5 rounded-card border border-borderColor bg-cardBg p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-xs text-secondaryText">On waitlist</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.notified}</p>
              <p className="text-xs text-secondaryText">Notified</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.pending}</p>
              <p className="text-xs text-secondaryText">Pending</p>
            </div>
          </div>

          {notReady && (
            <p className="text-sm text-error">
              Missing server config: {!summary.gemini_configured && 'GEMINI_API_KEY (a built-in message will be used) '}
              {!summary.resend_configured && 'RESEND_API_KEY / RESEND_FROM_EMAIL (sending is disabled)'}
            </p>
          )}

          <Button onClick={onSend} disabled={isSending || summary.next_batch === 0 || !summary.resend_configured}>
            {isSending
              ? 'Writing and sending...'
              : summary.next_batch === 0
                ? 'Everyone has been notified'
                : `Send launch email to ${summary.next_batch} people`}
          </Button>
          <p className="text-xs text-secondaryText">
            Sends at most {summary.max_per_send} per click. Click again for the next batch — anyone already emailed is skipped.
          </p>
        </section>
      )}

      {result && (
        <section className="space-y-3 rounded-card border border-borderColor bg-cardBg p-6">
          <p className="font-medium text-success">
            Sent to {result.sent} people · {result.remaining} still pending
          </p>
          {result.used_fallback && (
            <p className="text-sm text-secondaryText">Gemini was unavailable, so the built-in message was used.</p>
          )}
          <p className="text-sm font-semibold">Subject: {result.subject}</p>
          <p className="whitespace-pre-wrap text-sm text-secondaryText">{result.body}</p>
        </section>
      )}
    </main>
  );
}
