'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'fundry_admin_token';

interface Summary {
  named: number;
  total: number;
  notified: number;
  pending: number;
  next_batch: number;
  max_per_send: number;
  gemini_configured: boolean;
  email_configured: boolean;
}

interface SendResult {
  sent: number;
  failed: number;
  remaining: number;
  subject: string;
  body: string;
  used_fallback: boolean;
  warning: string | null;
}

interface Sample {
  email: string;
  greeting: string;
  company: string | null;
}

interface PreviewResult {
  subject: string;
  body: string;
  used_fallback: boolean;
  fallback_reason: string | null;
  samples: Sample[];
}

type LogItem =
  | { id: number; kind: 'text'; role: 'bot' | 'user'; text: string; tone?: 'error' | 'success' }
  | { id: number; kind: 'email'; subject: string; body: string; fallback: boolean; reason?: string | null; samples?: Sample[] };

// Omit<> on a union collapses it, so strip `id` from each member separately.
type LogInput = LogItem extends infer T ? (T extends { id: number } ? Omit<T, 'id'> : never) : never;

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

function BotAvatar({ size = 44, busy = false }: { size?: number; busy?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {busy && <span className="absolute inset-0 animate-ping rounded-2xl bg-blue-500/40" />}
      <svg viewBox="0 0 48 48" width={size} height={size} className="relative" aria-hidden>
        <defs>
          <linearGradient id="botg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <line x1="24" y1="4" x2="24" y2="10" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="4" r="3" fill="#60a5fa">
          {busy && <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite" />}
        </circle>
        <rect x="6" y="10" width="36" height="30" rx="10" fill="url(#botg)" />
        <rect x="11" y="16" width="26" height="16" rx="6" fill="#0b1020" />
        <circle cx="19" cy="24" r="3" fill="#67e8f9" />
        <circle cx="29" cy="24" r="3" fill="#67e8f9" />
        <rect x="19" y="35" width="10" height="2" rx="1" fill="#c7d2fe" />
      </svg>
    </div>
  );
}

function Bubble({ role, tone, children }: { role: 'bot' | 'user'; tone?: 'error' | 'success'; children: React.ReactNode }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">{children}</div>
      </div>
    );
  }
  const toneClass =
    tone === 'error'
      ? 'border-red-500/40 bg-red-500/10 text-red-200'
      : tone === 'success'
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
        : 'border-white/10 bg-white/5 text-gray-100';
  return (
    <div className="flex items-start gap-2.5">
      <BotAvatar size={28} />
      <div className={`max-w-[85%] rounded-2xl rounded-tl-sm border px-4 py-2.5 text-sm ${toneClass}`}>{children}</div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-300"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [stage, setStage] = useState<'idle' | 'writing' | 'sending'>('idle');
  const [draft, setDraft] = useState<{ subject: string; body: string; fallback: boolean } | null>(null);
  const [contactsText, setContactsText] = useState('');
  const [isSavingContacts, setIsSavingContacts] = useState(false);
  const [log, setLog] = useState<LogItem[]>([]);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  const push = useCallback((item: LogInput) => {
    setLog((l) => [...l, { ...item, id: nextId.current++ } as LogItem]);
  }, []);

  const logout = useCallback((message = '') => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSummary(null);
    setLog([]);
    setDraft(null);
    greeted.current = false;
    setLoginError(message);
  }, []);

  const loadSummary = useCallback(
    async (t: string) => {
      try {
        setSummary(await adminFetch<Summary>('/api/v1/admin/waitlist/summary', t));
      } catch (err) {
        if (err instanceof AdminAuthError) logout(err.message);
        else push({ kind: 'text', role: 'bot', tone: 'error', text: err instanceof Error ? err.message : 'Could not load waitlist stats.' });
      }
    },
    [logout, push]
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      loadSummary(stored);
    }
    setReady(true);
  }, [loadSummary]);

  // First-load greeting.
  useEffect(() => {
    if (!summary || greeted.current) return;
    greeted.current = true;
    if (summary.pending === 0) {
      push({ kind: 'text', role: 'bot', text: `Hi! Everyone on the waitlist (${summary.total}) has already been notified. Nothing left for me to send.` });
    } else {
      push({
        kind: 'text',
        role: 'bot',
        text: `Hi! I'm the Fundry launch bot. ${summary.pending} ${summary.pending === 1 ? 'person is' : 'people are'} waiting. Tap Preview and I'll draft the announcement with Gemini so you can check it before it goes out to the next ${summary.next_batch}.`,
      });
    }
  }, [summary, push]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [log, stage]);

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

  const saveContacts = async () => {
    if (!token || !contactsText.trim() || isSavingContacts) return;
    setIsSavingContacts(true);
    try {
      const data = await adminFetch<{ updated: number; not_found: string[] }>('/api/v1/admin/waitlist/contacts', token, {
        method: 'POST',
        body: JSON.stringify({ rows: contactsText }),
      });
      setContactsText('');
      push({
        kind: 'text',
        role: 'bot',
        tone: data.updated > 0 ? 'success' : 'error',
        text: `Saved names for ${data.updated} ${data.updated === 1 ? 'person' : 'people'}.${
          data.not_found.length > 0 ? ` Not on the waitlist: ${data.not_found.join(', ')}.` : ''
        }`,
      });
      loadSummary(token);
    } catch (err) {
      if (err instanceof AdminAuthError) logout(err.message);
      else push({ kind: 'text', role: 'bot', tone: 'error', text: err instanceof Error ? err.message : 'Could not save names.' });
    } finally {
      setIsSavingContacts(false);
    }
  };

  const onPreview = async () => {
    if (!token || stage !== 'idle') return;
    push({ kind: 'text', role: 'user', text: draft ? 'Write a different version' : 'Write the launch email' });
    setStage('writing');
    try {
      const data = await adminFetch<PreviewResult>('/api/v1/admin/waitlist/preview-launch', token, { method: 'POST' });
      setDraft({ subject: data.subject, body: data.body, fallback: data.used_fallback });
      push({ kind: 'email', subject: data.subject, body: data.body, fallback: data.used_fallback, reason: data.fallback_reason, samples: data.samples });
      push({ kind: 'text', role: 'bot', text: 'That is the draft. Send it as is, or tap Rewrite for another version.' });
    } catch (err) {
      if (err instanceof AdminAuthError) logout(err.message);
      else push({ kind: 'text', role: 'bot', tone: 'error', text: err instanceof Error ? err.message : 'Could not write the draft.' });
    } finally {
      setStage('idle');
    }
  };

  const onSend = async () => {
    if (!token || !summary || !draft || stage !== 'idle') return;
    if (!window.confirm(`Send this email to ${summary.next_batch} people now?`)) return;

    push({ kind: 'text', role: 'user', text: 'Looks good, send it 🚀' });
    setStage('sending');
    try {
      const data = await adminFetch<SendResult>('/api/v1/admin/waitlist/send-launch', token, {
        method: 'POST',
        body: JSON.stringify({ subject: draft.subject, body: draft.body, used_fallback: draft.fallback }),
      });
      setDraft(null);
      push({
        kind: 'text',
        role: 'bot',
        tone: 'success',
        text: `Done! Sent to ${data.sent} ${data.sent === 1 ? 'person' : 'people'}. ${
          data.remaining > 0 ? `${data.remaining} still pending. Preview again for the next batch.` : 'The whole waitlist has been notified. 🎉'
        }${data.failed > 0 ? ` (${data.failed} bad ${data.failed === 1 ? 'address' : 'addresses'} skipped.)` : ''}`,
      });
      if (data.warning) push({ kind: 'text', role: 'bot', tone: 'error', text: data.warning });
      loadSummary(token);
    } catch (err) {
      if (err instanceof AdminAuthError) logout(err.message);
      else push({ kind: 'text', role: 'bot', tone: 'error', text: err instanceof Error ? err.message : 'Send failed.' });
    } finally {
      setStage('idle');
    }
  };

  if (!ready) return null;

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <form onSubmit={onLogin} className="w-full space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <div className="flex justify-center">
            <BotAvatar size={72} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fundry Launch Bot</h1>
            <p className="mt-1 text-sm text-secondaryText">Enter the passcode to wake me up.</p>
          </div>
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
          <Button type="submit" disabled={isLoggingIn || !passcode} className="w-full">
            {isLoggingIn ? 'Checking...' : 'Wake the bot'}
          </Button>
        </form>
      </main>
    );
  }

  const needsSetup = summary && (!summary.gemini_configured || !summary.email_configured);
  const canPreview = !!summary && summary.next_batch > 0 && stage === 'idle';
  const canSend = canPreview && !!summary?.email_configured && !!draft;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center gap-3">
        <BotAvatar busy={stage !== 'idle'} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">Fundry Launch Bot</h1>
          <p className="flex items-center gap-1.5 text-xs text-secondaryText">
            <span className={`h-2 w-2 rounded-full ${needsSetup ? 'bg-amber-400' : 'bg-emerald-400'} ${stage !== 'idle' ? 'animate-pulse' : ''}`} />
            {stage === 'writing' ? 'Writing with Gemini…' : stage === 'sending' ? 'Sending emails…' : needsSetup ? 'Needs setup' : 'Online'}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => logout()}>
          Log out
        </Button>
      </header>

      {summary && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'On waitlist', value: summary.total },
            { label: 'Notified', value: summary.notified },
            { label: 'Pending', value: summary.pending },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-[11px] uppercase tracking-wide text-secondaryText">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <details className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <summary className="cursor-pointer text-secondaryText">
            Names on file: {summary.named} of {summary.total} (tap to add first names and investor companies)
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-secondaryText">One person per line: email, first name, company (company optional).</p>
            <textarea
              rows={5}
              value={contactsText}
              onChange={(e) => setContactsText(e.target.value)}
              placeholder={'ada@example.com, Ada, Acme Ventures\nben@example.com, Ben'}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white outline-none focus:border-blue-500"
            />
            <Button size="sm" onClick={saveContacts} disabled={isSavingContacts || !contactsText.trim()}>
              {isSavingContacts ? 'Saving...' : 'Save names'}
            </Button>
          </div>
        </details>
      )}

      {needsSetup && summary && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200">
          Missing server config:{' '}
          {!summary.gemini_configured && 'GEMINI_API_KEY (I will use a built-in message). '}
          {!summary.email_configured && 'BREVO_API_KEY / BREVO_SENDER_EMAIL (sending is disabled).'}
        </div>
      )}

      <section className="flex min-h-[320px] flex-1 flex-col gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-black/30 p-4">
        {log.map((item) =>
          item.kind === 'text' ? (
            <Bubble key={item.id} role={item.role} tone={item.tone}>
              {item.text}
            </Bubble>
          ) : (
            <div key={item.id} className="flex items-start gap-2.5">
              <BotAvatar size={28} />
              <div className="w-full max-w-[90%] space-y-2">
                <p className="text-xs text-secondaryText">
                  {item.fallback ? 'Gemini was unavailable, so I used the built-in message:' : 'Here is what I wrote with Gemini:'}
                </p>
                {item.fallback && item.reason && (
                  <p className="break-words rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
                    Why: {item.reason}
                  </p>
                )}
                <div className="overflow-hidden rounded-2xl bg-white text-gray-900 shadow-lg">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
                    <p>
                      <span className="font-semibold text-gray-700">From:</span> Fundry
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Subject:</span> {item.subject}
                    </p>
                  </div>
                  <div className="space-y-3 px-4 py-3 text-sm leading-relaxed">
                    <p className="text-gray-500">Hi [first name],</p>
                    <p className="whitespace-pre-wrap">{item.body}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Open Fundry</span>
                      <span className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white">Follow us on X</span>
                      <span className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">Subscribe on YouTube</span>
                    </div>
                    <p>The Fundry Team</p>
                  </div>
                </div>
                {item.samples && item.samples.length > 0 && (
                  <p className="text-[11px] text-secondaryText">
                    Greetings I&apos;ll use: {item.samples.map((x) => x.greeting.replace(/^Hi |,$/g, '')).join(', ')}
                    {item.samples.some((x) => x.company) ? ' (investor company lines added where known)' : ''}
                  </p>
                )}
              </div>
            </div>
          )
        )}

        {stage !== 'idle' && (
          <Bubble role="bot">
            <div className="flex items-center gap-2">
              <span>{stage === 'writing' ? 'Writing the announcement' : 'Sending to the waitlist'}</span>
              <TypingDots />
            </div>
          </Bubble>
        )}
        <div ref={endRef} />
      </section>

      <div className="space-y-2">
        {draft ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onPreview}
              disabled={stage !== 'idle'}
              className="rounded-2xl border border-white/15 bg-white/5 px-3 py-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↻ Rewrite
            </button>
            <button onClick={onSend} disabled={!canSend} className="col-span-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
              {stage === 'sending' ? 'Sending…' : `🚀 Send to ${summary?.next_batch ?? 0}`}
            </button>
          </div>
        ) : (
          <button onClick={onPreview} disabled={!canPreview} className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
            {stage !== 'idle'
              ? 'Working…'
              : !summary
                ? 'Loading…'
                : summary.next_batch === 0
                  ? 'Everyone has been notified'
                  : '✍️ Preview email'}
          </button>
        )}
        {summary && (
          <p className="text-center text-xs text-secondaryText">
            Up to {summary.max_per_send} emails per send. Anyone already emailed is skipped.
          </p>
        )}
      </div>
    </main>
  );
}
