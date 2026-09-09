'use client';

import { useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/app/lib/api';
import type { MessageThread } from '@/app/lib/types/message';
import { Badge } from '@/app/components/ui/Badge';
import { ChatPanel } from '@/app/components/dashboard/ChatPanel';
import { cn } from '@/app/lib/utils';

const POLL_INTERVAL_MS = 5000;

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function MessagesInbox({ initialConnectionId }: { initialConnectionId?: string }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(initialConnectionId ?? null);

  const loadThreads = async () => {
    try {
      const data = await apiGet<MessageThread[]>('/api/v1/messages/threads');
      setThreads(data);
      setError(null);
      // Deep link from a dashboard's "Message" button — select it once
      // threads have loaded, even if it wasn't the first one in the list.
      setActiveId((current) => current ?? initialConnectionId ?? (data[0]?.connection_id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your conversations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeThread = threads.find((t) => t.connection_id === activeId) ?? null;

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[480px] overflow-hidden rounded-card border border-borderColor bg-cardBg">
      {/* Thread list — hidden on mobile once a conversation is open, matching the familiar DM-app pattern. */}
      <div
        className={cn(
          'w-full shrink-0 flex-col border-borderColor sm:flex sm:w-80 sm:border-r',
          activeId ? 'hidden sm:flex' : 'flex'
        )}
      >
        <div className="border-b border-borderColor px-4 py-3">
          <h2 className="text-sm font-semibold text-primaryText">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading && <p className="p-4 text-sm text-secondaryText">Loading conversations…</p>}
          {error && <p className="p-4 text-sm text-error">{error}</p>}
          {!isLoading && !error && threads.length === 0 && (
            <p className="p-4 text-sm text-secondaryText">
              No conversations yet — messaging unlocks once a connection request is accepted.
            </p>
          )}
          {threads.map((thread) => (
            <button
              key={thread.connection_id}
              onClick={() => setActiveId(thread.connection_id)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-borderColor px-4 py-3 text-left transition',
                thread.connection_id === activeId ? 'bg-secondaryBg' : 'hover:bg-secondaryBg/60'
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primaryBlue/10 text-sm font-semibold text-accentCyan">
                {initials(thread.counterparty_label)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-primaryText">{thread.counterparty_label}</p>
                  {thread.last_message_at && (
                    <span className="shrink-0 text-xs text-secondaryText">{relativeTime(thread.last_message_at)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-secondaryText">{thread.last_message ?? 'Say hello 👋'}</p>
                  {thread.unread_count > 0 && (
                    <Badge tone="info" className="shrink-0">
                      {thread.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active conversation */}
      <div className={cn('min-w-0 flex-1 flex-col sm:flex', activeId ? 'flex' : 'hidden')}>
        {activeThread ? (
          <>
            <div className="flex items-center gap-3 border-b border-borderColor px-4 py-3">
              <button
                onClick={() => setActiveId(null)}
                className="text-secondaryText hover:text-primaryText sm:hidden"
                aria-label="Back to conversations"
              >
                ←
              </button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlue/10 text-xs font-semibold text-accentCyan">
                {initials(activeThread.counterparty_label)}
              </div>
              <p className="text-sm font-semibold text-primaryText">{activeThread.counterparty_label}</p>
            </div>
            <ChatPanel
              key={activeThread.connection_id}
              connectionId={activeThread.connection_id}
              counterpartyLabel={activeThread.counterparty_label}
              className="flex-1"
              bare
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-secondaryText">Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
