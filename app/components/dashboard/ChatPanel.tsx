'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { apiGet, apiPost, ApiError } from '@/app/lib/api';
import type { Message } from '@/app/lib/types/message';
import { cn } from '@/app/lib/utils';

const POLL_INTERVAL_MS = 4000;
// Messages within this gap of each other from the same sender are visually
// grouped (no repeated timestamp, tighter spacing) — the standard
// Messenger/WhatsApp convention rather than a timestamp on every bubble.
const GROUP_GAP_MS = 5 * 60_000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDayDivider(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

interface RenderItem {
  message: Message;
  showDayDivider: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
}

function buildRenderItems(messages: Message[]): RenderItem[] {
  return messages.map((message, index) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];

    const showDayDivider =
      !prev || new Date(prev.created_at).toDateString() !== new Date(message.created_at).toDateString();

    const isGroupStart =
      !prev ||
      prev.is_mine !== message.is_mine ||
      new Date(message.created_at).getTime() - new Date(prev.created_at).getTime() > GROUP_GAP_MS ||
      showDayDivider;

    const isGroupEnd =
      !next ||
      next.is_mine !== message.is_mine ||
      new Date(next.created_at).getTime() - new Date(message.created_at).getTime() > GROUP_GAP_MS;

    return { message, showDayDivider, isGroupStart, isGroupEnd };
  });
}

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

  const renderItems = useMemo(() => buildRenderItems(messages), [messages]);

  // "Seen" shows once, under the most recent message I sent that the other
  // person has actually read — same convention as Messenger, not repeated
  // on every bubble.
  const lastSeenMineId = useMemo(() => {
    const mineRead = messages.filter((m) => m.is_mine && m.read_at);
    return mineRead.length > 0 ? mineRead[mineRead.length - 1].id : null;
  }, [messages]);

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

      <div className="flex-1 space-y-0.5 overflow-y-auto px-4 py-3">
        {loading && <p className="text-sm text-secondaryText">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-secondaryText">No messages yet — say hello.</p>
        )}
        {renderItems.map(({ message: m, showDayDivider, isGroupStart, isGroupEnd }) => (
          <div key={m.id}>
            {showDayDivider && (
              <div className="my-3 text-center text-xs font-medium text-secondaryText">
                {formatDayDivider(m.created_at)}
              </div>
            )}
            <div
              className={cn('flex', m.is_mine ? 'justify-end' : 'justify-start', isGroupStart ? 'mt-2' : 'mt-0.5')}
            >
              <div
                title={formatTime(m.created_at)}
                className={cn(
                  'max-w-[75%] whitespace-pre-wrap break-words px-4 py-2 text-sm',
                  m.is_mine ? 'bg-primaryBlue text-white' : 'bg-secondaryBg text-primaryText',
                  // Messenger-style grouping: rounded on the outer corners of
                  // a run of consecutive bubbles, flatter where they touch.
                  m.is_mine
                    ? cn(
                        'rounded-l-2xl',
                        isGroupStart ? 'rounded-tr-2xl' : 'rounded-tr-md',
                        isGroupEnd ? 'rounded-br-2xl' : 'rounded-br-md'
                      )
                    : cn(
                        'rounded-r-2xl',
                        isGroupStart ? 'rounded-tl-2xl' : 'rounded-tl-md',
                        isGroupEnd ? 'rounded-bl-2xl' : 'rounded-bl-md'
                      )
                )}
              >
                {m.body}
              </div>
            </div>
            {m.id === lastSeenMineId && (
              <p className="mt-1 text-right text-[11px] text-secondaryText">Seen {formatTime(m.read_at!)}</p>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-xs text-error">{error}</p>}

      <div className="flex items-center gap-2 border-t border-borderColor p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a message…"
          className="min-h-[44px] flex-1 rounded-full border border-borderColor bg-secondaryBg px-5 text-sm text-primaryText placeholder-secondaryText outline-none transition focus:border-primaryBlue focus:ring-1 focus:ring-primaryBlue"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primaryBlue text-white transition hover:bg-hoverBlue disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
