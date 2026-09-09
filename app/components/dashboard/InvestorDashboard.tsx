'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Badge } from '@/app/components/ui/Badge';
import { LinkPreviewCard } from '@/app/components/ui/LinkPreviewCard';
import { apiDelete, apiGet, apiPost, ApiError } from '@/app/lib/api';
import {
  STAGE_LABELS,
  VERIFICATION_LABELS,
  type FounderDirectoryFilters,
  type FounderProfile,
} from '@/app/lib/types/founderProfile';
import type { ConnectionRequestRecord } from '@/app/lib/types/connection';

type Tab = 'discover' | 'saved' | 'sent';

const STAGE_OPTIONS = Object.entries(STAGE_LABELS) as [FounderProfile['stage'], string][];

function buildQuery(filters: FounderDirectoryFilters): string {
  const params = new URLSearchParams();
  if (filters.sector) params.set('sector', filters.sector);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.funding_min !== undefined) params.set('funding_min', String(filters.funding_min));
  if (filters.funding_max !== undefined) params.set('funding_max', String(filters.funding_max));
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function InvestorDashboard() {
  const [tab, setTab] = useState<Tab>('discover');

  const [filters, setFilters] = useState<FounderDirectoryFilters>({});
  const [profiles, setProfiles] = useState<FounderProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  const [saved, setSaved] = useState<FounderProfile[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  const [sent, setSent] = useState<ConnectionRequestRecord[]>([]);
  const [isLoadingSent, setIsLoadingSent] = useState(true);

  const [composingFor, setComposingFor] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const data = await apiGet<FounderProfile[]>(`/api/v1/founder-profiles${buildQuery(filters)}`);
      setProfiles(data);
    } catch {
      // Keep the last successful list rather than clearing it on a transient failure.
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [filters]);

  const loadSaved = useCallback(async () => {
    setIsLoadingSaved(true);
    try {
      setSaved(await apiGet<FounderProfile[]>('/api/v1/founder-profiles/saved'));
    } catch {
      // non-critical
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  const loadSent = useCallback(async () => {
    setIsLoadingSent(true);
    try {
      setSent(await apiGet<ConnectionRequestRecord[]>('/api/v1/connections/sent'));
    } catch {
      // non-critical
    } finally {
      setIsLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    loadSaved();
    loadSent();
  }, [loadSaved, loadSent]);

  // `sent` only reflects each connection's status as of the last fetch — if
  // the founder accepts/declines while the investor is already sitting on
  // this dashboard, the Message button gated on `status === 'accepted'`
  // would otherwise never appear without a hard refresh. Refetch whenever
  // the investor switches to this tab, and lightly poll while it's active
  // so an accept that happens mid-session still shows up.
  useEffect(() => {
    if (tab !== 'sent') return;
    loadSent();
    const interval = setInterval(loadSent, 8000);
    return () => clearInterval(interval);
  }, [tab, loadSent]);

  const toggleSave = async (profile: FounderProfile) => {
    setActionError('');
    setPendingProfileId(profile.id);
    try {
      if (profile.is_saved) {
        await apiDelete(`/api/v1/founder-profiles/${profile.id}/save`);
      } else {
        await apiPost(`/api/v1/founder-profiles/${profile.id}/save`, undefined);
      }
      const patch = (list: FounderProfile[]) =>
        list.map((p) => (p.id === profile.id ? { ...p, is_saved: !p.is_saved } : p));
      setProfiles(patch);
      if (profile.is_saved) {
        setSaved((current) => current.filter((p) => p.id !== profile.id));
      } else {
        loadSaved();
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update your watchlist.');
    } finally {
      setPendingProfileId(null);
    }
  };

  const sendConnectionRequest = async (profileId: string) => {
    setActionError('');
    setPendingProfileId(profileId);
    try {
      await apiPost('/api/v1/connections', { founder_profile_id: profileId, message: message || undefined });
      setComposingFor(null);
      setMessage('');
      loadSent();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not send this request.');
    } finally {
      setPendingProfileId(null);
    }
  };

  const renderProfileCard = (profile: FounderProfile) => (
    <li key={profile.id} className="rounded-input border border-borderColor bg-secondaryBg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {profile.profile_picture_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_picture_url}
              alt={profile.startup_name}
              className="h-12 w-12 shrink-0 rounded-full border border-borderColor object-cover"
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{profile.startup_name}</h3>
              <Badge tone="info">{VERIFICATION_LABELS[profile.verification_tier]}</Badge>
            </div>
            {profile.tagline && <p className="mt-1 text-sm text-secondaryText">{profile.tagline}</p>}
            <p className="mt-1 text-xs text-secondaryText">
              {STAGE_LABELS[profile.stage]}
              {profile.sector ? ` · ${profile.sector}` : ''}
              {profile.location_city ? ` · ${profile.location_city}` : ''}
              {profile.funding_ask_min || profile.funding_ask_max
                ? ` · Asking $${(profile.funding_ask_min ?? 0).toLocaleString()}–$${(profile.funding_ask_max ?? 0).toLocaleString()}`
                : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toggleSave(profile)}
            disabled={pendingProfileId === profile.id}
          >
            {profile.is_saved ? 'Saved' : 'Save'}
          </Button>
          <Button
            size="sm"
            onClick={() => setComposingFor(composingFor === profile.id ? null : profile.id)}
          >
            Connect
          </Button>
        </div>
      </div>

      {profile.startup_link && (
        <div className="mt-3">
          <LinkPreviewCard url={profile.startup_link} />
        </div>
      )}

      {profile.gallery_image_urls.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {profile.gallery_image_urls.slice(0, 4).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="h-20 w-full rounded-input border border-borderColor object-cover" />
          ))}
        </div>
      )}

      {profile.demo_video_url && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={profile.demo_video_url}
          controls
          className="mt-3 max-h-64 w-full rounded-input border border-borderColor"
        />
      )}

      {profile.contact && (
        <p className="mt-3 text-sm text-success">Contact unlocked: {profile.contact.email}</p>
      )}

      {composingFor === profile.id && (
        <div className="mt-4 space-y-3 border-t border-borderColor pt-4">
          <Textarea
            rows={3}
            placeholder="Introduce yourself and say why you're interested (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-3">
            <Button size="sm" onClick={() => sendConnectionRequest(profile.id)} disabled={pendingProfileId === profile.id}>
              {pendingProfileId === profile.id ? 'Sending...' : 'Send Request'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setComposingFor(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-borderColor">
        {(['discover', 'saved', 'sent'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize transition ${
              tab === t
                ? 'border-b-2 border-primaryBlue text-primaryText'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            {t === 'sent' ? 'Sent Requests' : t}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="rounded-[14px] border border-error bg-error/10 p-4 text-sm text-error">{actionError}</div>
      )}

      {tab === 'discover' && (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-card border border-borderColor bg-cardBg p-5 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Search startups..."
              className="lg:col-span-2"
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            />
            <Input
              placeholder="Sector"
              value={filters.sector ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value || undefined }))}
            />
            <Select
              value={filters.stage ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, stage: (e.target.value || undefined) as FounderProfile['stage'] }))}
            >
              <option value="">All stages</option>
              {STAGE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="Min funding ask"
              value={filters.funding_min ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, funding_min: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </div>

          {isLoadingProfiles ? (
            <p className="text-secondaryText">Loading startups...</p>
          ) : profiles.length === 0 ? (
            <p className="text-secondaryText">No startups match these filters yet.</p>
          ) : (
            <ul className="space-y-4">{profiles.map(renderProfileCard)}</ul>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div>
          {isLoadingSaved ? (
            <p className="text-secondaryText">Loading your watchlist...</p>
          ) : saved.length === 0 ? (
            <p className="text-secondaryText">Nothing saved yet — save a startup from Discover to track it here.</p>
          ) : (
            <ul className="space-y-4">{saved.map(renderProfileCard)}</ul>
          )}
        </div>
      )}

      {tab === 'sent' && (
        <div>
          {isLoadingSent ? (
            <p className="text-secondaryText">Loading your requests...</p>
          ) : sent.length === 0 ? (
            <p className="text-secondaryText">You haven&apos;t sent any connection requests yet.</p>
          ) : (
            <ul className="space-y-4">
              {sent.map((connection) => (
                <li key={connection.id} className="rounded-input border border-borderColor bg-secondaryBg p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{connection.startup_name}</p>
                    <Badge
                      tone={
                        connection.status === 'accepted'
                          ? 'success'
                          : connection.status === 'declined'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {connection.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-secondaryText">
                    Sent {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                  {connection.status === 'accepted' && (
                    <div className="mt-3">
                      <Link href={`/messages?connection=${connection.id}`}>
                        <Button size="sm" variant="secondary">
                          Message
                        </Button>
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
