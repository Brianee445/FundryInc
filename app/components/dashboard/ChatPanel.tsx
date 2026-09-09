'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPost, ApiError } from '@/app/lib/api';
import type { Message } from '@/app/lib/types/message';
import { Button } from '@/app/components/ui/Button';
import { Textarea } from '@/app/components/ui/Textarea';
import { cn } from '@/app/lib/utils';

const POLL_INTERVAL_MS = 4000;

export function ChatPanel({
  connectionId,
  counterpartyLabel,
  className,
  bare = false,
}: {
  connectionId: string;
  counterpartyLabel: string;
  /** Extra classes for the outer container — use to override the default fixed height. */
  className?: string;
  /** Skip the outer card border/background — for embedding inside a page that already provides chrome. */
  bare?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await apiGet<Message[]>(`/api/v1/connections/${connectionId}/messages`);
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    try {
      const sent = await apiPost<Message>(`/api/v1/connections/${connectionId}/messages`, { body });
      setMessages((prev) => [...prev, sent]);
      setDraft('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Message failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        bare ? '' : 'rounded-card border border-borderColor bg-cardBg',
        className ?? 'h-96'
      )}
    >
      {!bare && (
        <div className="border-b border-borderColor px-4 py-3">
          <p className="text-sm font-semibold text-primaryText">{counterpartyLabel}</p>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {loading && <p className="text-sm text-secondaryText">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-secondaryText">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.is_mine ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.is_mine
                  ? 'max-w-[75%] rounded-input bg-primaryBlue px-4 py-2 text-sm text-white'
                  : 'max-w-[75%] rounded-input bg-secondaryBg px-4 py-2 text-sm text-primaryText'
              }
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-xs text-error">{error}</p>}

      <div className="flex items-end gap-2 border-t border-borderColor p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a message…"
          rows={1}
          className="min-h-[44px] resize-none py-3"
        />
        <Button onClick={handleSend} disabled={sending || !draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
