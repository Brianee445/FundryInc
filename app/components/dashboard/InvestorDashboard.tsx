'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Badge } from '@/app/components/ui/Badge';
import { VerificationBadge } from '@/app/components/ui/VerificationBadge';
import { LinkPreviewCard } from '@/app/components/ui/LinkPreviewCard';
import { MediaUploadField } from '@/app/components/ui/MediaUploadField';
import { StatCard, ActivityChart } from '@/app/components/dashboard/ActivityChart';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, ApiError } from '@/app/lib/api';
import type { InvestorAnalytics } from '@/app/lib/types/analytics';
import {
  STAGE_LABELS,
  VERIFICATION_LABELS,
  type FounderDirectoryFilters,
  type FounderProfile,
} from '@/app/lib/types/founderProfile';
import {
  INVESTOR_TYPE_LABELS,
  type InvestorProfile,
  type InvestorProfileInput,
} from '@/app/lib/types/investorProfile';
import {
  investorProfileSchema,
  tagsToArray,
  type InvestorProfileFormData,
} from '@/app/lib/validations/investorProfile';
import type { ConnectionRequestRecord } from '@/app/lib/types/connection';

type Tab = 'discover' | 'saved' | 'sent' | 'my-profile' | 'received-pitches';

const STAGE_OPTIONS = Object.entries(STAGE_LABELS) as [FounderProfile['stage'], string][];
const INVESTOR_TYPE_OPTIONS = Object.entries(INVESTOR_TYPE_LABELS) as [InvestorProfile['investor_type'], string][];

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

  const [analytics, setAnalytics] = useState<InvestorAnalytics | null>(null);

  // My Profile (investor's own, for founders to discover)
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [isLoadingInvestorProfile, setIsLoadingInvestorProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormError, setProfileFormError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Pitches Received (founder-initiated requests targeting this investor)
  const [pitchesReceived, setPitchesReceived] = useState<ConnectionRequestRecord[]>([]);
  const [isLoadingPitchesReceived, setIsLoadingPitchesReceived] = useState(true);
  const [decisionError, setDecisionError] = useState('');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    watch: watchProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<InvestorProfileFormData>({
    resolver: zodResolver(investorProfileSchema),
    defaultValues: { investor_type: 'angel', contact_visibility: 'private' },
  });

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

  const loadSent = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoadingSent(true);
    try {
      setSent(await apiGet<ConnectionRequestRecord[]>('/api/v1/connections/sent'));
    } catch {
      // non-critical
    } finally {
      if (!opts?.silent) setIsLoadingSent(false);
    }
  }, []);

  const loadInvestorProfile = useCallback(async () => {
    setIsLoadingInvestorProfile(true);
    try {
      const data = await apiGet<InvestorProfile>('/api/v1/investor-profiles/me');
      setInvestorProfile(data);
      resetProfile({
        investor_type: data.investor_type,
        firm_name: data.firm_name ?? '',
        bio: data.bio ?? '',
        check_size_min: data.check_size_min ?? undefined,
        check_size_max: data.check_size_max ?? undefined,
        sectors_of_interest_raw: (data.sectors_of_interest ?? []).join(', '),
        geographies_of_interest_raw: (data.geographies_of_interest ?? []).join(', '),
        profile_picture_url: data.profile_picture_url ?? '',
        linkedin_url: data.linkedin_url ?? '',
        contact_visibility: data.contact_visibility,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setInvestorProfile(null);
        setIsEditingProfile(true);
      }
    } finally {
      setIsLoadingInvestorProfile(false);
    }
  }, [resetProfile]);

  const loadPitchesReceived = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoadingPitchesReceived(true);
    try {
      setPitchesReceived(await apiGet<ConnectionRequestRecord[]>('/api/v1/connections/received'));
    } catch {
      // non-critical
    } finally {
      if (!opts?.silent) setIsLoadingPitchesReceived(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    loadSaved();
    loadSent();
    loadInvestorProfile();
    loadPitchesReceived();
  }, [loadSaved, loadSent, loadInvestorProfile, loadPitchesReceived]);

  useEffect(() => {
    apiGet<InvestorAnalytics>('/api/v1/analytics/investor').then(setAnalytics).catch(() => {
      // Non-critical — the rest of the dashboard works without it.
    });
  }, []);

  // `sent` only reflects each connection's status as of the last fetch — if
  // the founder accepts/declines while the investor is already sitting on
  // this dashboard, the Message button gated on `status === 'accepted'`
  // would otherwise never appear without a hard refresh. Refetch (silently,
  // so the list doesn't flash back to a loading state every cycle) whenever
  // the investor switches to this tab, and lightly poll while it's active
  // so an accept that happens mid-session still shows up.
  useEffect(() => {
    if (tab !== 'sent') return;
    loadSent({ silent: true });
    const interval = setInterval(() => loadSent({ silent: true }), 8000);
    return () => clearInterval(interval);
  }, [tab, loadSent]);

  useEffect(() => {
    if (tab !== 'received-pitches') return;
    loadPitchesReceived({ silent: true });
    const interval = setInterval(() => loadPitchesReceived({ silent: true }), 8000);
    return () => clearInterval(interval);
  }, [tab, loadPitchesReceived]);

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

  const onProfileSubmit = async (data: InvestorProfileFormData) => {
    setProfileFormError('');
    try {
      const { sectors_of_interest_raw, geographies_of_interest_raw, ...rest } = data;
      const payload: InvestorProfileInput = {
        ...rest,
        sectors_of_interest: tagsToArray(sectors_of_interest_raw),
        geographies_of_interest: tagsToArray(geographies_of_interest_raw),
      };
      const saved = await apiPut<InvestorProfile>('/api/v1/investor-profiles/me', payload);
      setInvestorProfile(saved);
      setIsEditingProfile(false);
    } catch (err) {
      setProfileFormError(err instanceof ApiError ? err.message : 'Could not save your profile. Please try again.');
    }
  };

  const toggleProfilePublish = async () => {
    if (!investorProfile) return;
    setPublishError('');
    setIsTogglingPublish(true);
    try {
      const updated = await apiPatch<InvestorProfile>(
        `/api/v1/investor-profiles/me/publish?published=${!investorProfile.published}`
      );
      setInvestorProfile(updated);
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : 'Could not update publish status.');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const decidePitch = async (id: string, decision: 'accepted' | 'declined') => {
    setDecisionError('');
    setDecidingId(id);
    try {
      const updated = await apiPatch<ConnectionRequestRecord>(`/api/v1/connections/${id}`, { status: decision });
      setPitchesReceived((current) => current.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setDecisionError(err instanceof ApiError ? err.message : 'Could not update this request.');
    } finally {
      setDecidingId(null);
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
              <VerificationBadge tier={profile.verification_tier} />
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'discover', label: 'Discover' },
    { id: 'saved', label: 'Saved' },
    { id: 'sent', label: 'Sent Requests' },
    { id: 'my-profile', label: 'My Profile' },
    { id: 'received-pitches', label: 'Pitches Received' },
  ];

  return (
    <div className="space-y-6">
      {analytics && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Requests sent" value={analytics.connection_requests_sent_total} />
            <StatCard label="Accepted" value={analytics.connection_requests_accepted} />
            <StatCard label="Saved founders" value={analytics.saved_founders_count} />
            <StatCard label="Messages sent" value={analytics.messages_total} />
          </div>
          <ActivityChart title="Connection requests sent (30 days)" data={analytics.connection_requests_daily} />
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto border-b border-borderColor">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-3 text-sm font-medium transition ${
              tab === t.id
                ? 'border-b-2 border-primaryBlue text-primaryText'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            {t.label}
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

      {tab === 'my-profile' && (
        <section className="rounded-card border border-borderColor bg-cardBg p-6 sm:p-8">
          <p className="mb-4 text-sm text-secondaryText">
            This is what founders see when they browse investors — it stays private until you publish it.
          </p>
          {isLoadingInvestorProfile ? (
            <p className="text-secondaryText">Loading your profile...</p>
          ) : isEditingProfile ? (
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
              <h2 className="text-xl font-semibold">
                {investorProfile ? 'Edit your investor profile' : 'Create your investor profile'}
              </h2>

              {profileFormError && (
                <div className="rounded-[14px] border border-error bg-error/10 p-4 text-sm text-error">
                  {profileFormError}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Investor Type</label>
                  <Select {...registerProfile('investor_type')}>
                    {INVESTOR_TYPE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Firm Name (optional)</label>
                  <Input placeholder="e.g. Acme Ventures" {...registerProfile('firm_name')} />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Bio</label>
                  <Textarea rows={4} placeholder="What do you invest in, and why?" {...registerProfile('bio')} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Check Size Min (USD)</label>
                  <Input type="number" min={0} placeholder="25000" {...registerProfile('check_size_min')} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Check Size Max (USD)</label>
                  <Input type="number" min={0} placeholder="250000" {...registerProfile('check_size_max')} />
                  {profileErrors.check_size_max && (
                    <p className="mt-1 text-sm text-error">{profileErrors.check_size_max.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Sectors of Interest</label>
                  <Input placeholder="Fintech, Healthtech, Logistics" {...registerProfile('sectors_of_interest_raw')} />
                  <p className="mt-1 text-xs text-secondaryText">Comma-separated.</p>
                  {profileErrors.sectors_of_interest_raw && (
                    <p className="mt-1 text-sm text-error">{profileErrors.sectors_of_interest_raw.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Geographies of Interest</label>
                  <Input placeholder="Nigeria, Kenya, Remote" {...registerProfile('geographies_of_interest_raw')} />
                  <p className="mt-1 text-xs text-secondaryText">Comma-separated.</p>
                  {profileErrors.geographies_of_interest_raw && (
                    <p className="mt-1 text-sm text-error">{profileErrors.geographies_of_interest_raw.message}</p>
                  )}
                </div>

                <MediaUploadField
                  kind="profile_picture"
                  label="Profile Picture"
                  value={watchProfile('profile_picture_url') ?? ''}
                  onChange={(url) => setProfileValue('profile_picture_url', url, { shouldDirty: true })}
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">LinkedIn URL (optional)</label>
                  <Input placeholder="https://linkedin.com/in/..." {...registerProfile('linkedin_url')} />
                  {profileErrors.linkedin_url && (
                    <p className="mt-1 text-sm text-error">{profileErrors.linkedin_url.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Contact Visibility</label>
                  <Select {...registerProfile('contact_visibility')}>
                    <option value="private">Private — reveal only after I accept a connection request</option>
                    <option value="public">Public — show my email on my profile</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
                {investorProfile && (
                  <Button type="button" variant="secondary" onClick={() => setIsEditingProfile(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : investorProfile ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {investorProfile.profile_picture_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={investorProfile.profile_picture_url}
                      alt={investorProfile.firm_name ?? 'You'}
                      className="h-16 w-16 shrink-0 rounded-full border border-borderColor object-cover"
                    />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {investorProfile.firm_name ?? INVESTOR_TYPE_LABELS[investorProfile.investor_type]}
                      </h2>
                      <Badge tone={investorProfile.published ? 'success' : 'warning'}>
                        {investorProfile.published ? 'Published' : 'Draft'}
                      </Badge>
                      <VerificationBadge tier={investorProfile.verification_tier} />
                      <Link
                        href="/billing"
                        className="rounded-button bg-primaryBlue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-hoverBlue"
                      >
                        {investorProfile.verification_tier === 'starter' ? 'Upgrade' : 'Manage plan'}
                      </Link>
                    </div>
                    {investorProfile.bio && <p className="mt-2 text-secondaryText">{investorProfile.bio}</p>}
                    <p className="mt-1 text-sm text-secondaryText">
                      {INVESTOR_TYPE_LABELS[investorProfile.investor_type]}
                      {investorProfile.sectors_of_interest.length > 0
                        ? ` · ${investorProfile.sectors_of_interest.join(', ')}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </Button>
                  <Button size="sm" onClick={toggleProfilePublish} disabled={isTogglingPublish}>
                    {isTogglingPublish ? 'Updating...' : investorProfile.published ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
              {publishError && <p className="mt-3 text-sm text-error">{publishError}</p>}
              {!investorProfile.published && (
                <p className="mt-4 text-sm text-secondaryText">
                  Your profile is a draft — founders can&apos;t discover it until you publish.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-input border border-dashed border-borderColor p-8 text-center">
              <p className="text-secondaryText">You haven&apos;t created your investor profile yet.</p>
              <Button size="sm" className="mt-4" onClick={() => setIsEditingProfile(true)}>
                Create your profile
              </Button>
            </div>
          )}
        </section>
      )}

      {tab === 'received-pitches' && (
        <section className="rounded-card border border-borderColor bg-cardBg p-6 sm:p-8">
          <h2 className="mb-4 text-xl font-semibold">Pitches from Founders</h2>
          {decisionError && <p className="mb-3 text-sm text-error">{decisionError}</p>}

          {isLoadingPitchesReceived ? (
            <p className="text-secondaryText">Loading...</p>
          ) : pitchesReceived.length === 0 ? (
            <p className="text-secondaryText">No pitches yet — founders can reach out once you publish your profile.</p>
          ) : (
            <ul className="space-y-4">
              {pitchesReceived.map((pitch) => (
                <li key={pitch.id} className="rounded-input border border-borderColor bg-secondaryBg p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{pitch.startup_name ?? 'A founder'}</p>
                      <p className="text-xs text-secondaryText">{new Date(pitch.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge
                      tone={pitch.status === 'accepted' ? 'success' : pitch.status === 'declined' ? 'error' : 'warning'}
                    >
                      {pitch.status}
                    </Badge>
                  </div>
                  {pitch.message && <p className="mt-3 text-sm text-secondaryText">{pitch.message}</p>}
                  {pitch.status === 'pending' && (
                    <div className="mt-4 flex gap-3">
                      <Button size="sm" onClick={() => decidePitch(pitch.id, 'accepted')} disabled={decidingId === pitch.id}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => decidePitch(pitch.id, 'declined')}
                        disabled={decidingId === pitch.id}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                  {pitch.status === 'accepted' && (
                    <div className="mt-4">
                      <Link href={`/messages?connection=${pitch.id}`}>
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
        </section>
      )}
    </div>
  );
}
