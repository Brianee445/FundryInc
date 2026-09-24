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
import { GalleryUploadField } from '@/app/components/ui/GalleryUploadField';
import { StatCard, ActivityChart } from '@/app/components/dashboard/ActivityChart';
import { apiGet, apiPatch, apiPost, apiPut, ApiError } from '@/app/lib/api';
import type { FounderAnalytics } from '@/app/lib/types/analytics';
import {
  founderProfileSchema,
  galleryRawToArray,
  type FounderProfileFormData,
} from '@/app/lib/validations/founderProfile';
import {
  STAGE_LABELS,
  VERIFICATION_LABELS,
  type FounderProfile,
  type FounderProfileInput,
} from '@/app/lib/types/founderProfile';
import {
  INVESTOR_TYPE_LABELS,
  type InvestorDirectoryFilters,
  type InvestorProfile,
} from '@/app/lib/types/investorProfile';
import type { ConnectionRequestRecord } from '@/app/lib/types/connection';

const STAGE_OPTIONS = Object.entries(STAGE_LABELS) as [FounderProfile['stage'], string][];
const INVESTOR_TYPE_OPTIONS = Object.entries(INVESTOR_TYPE_LABELS) as [InvestorProfile['investor_type'], string][];

type Tab = 'profile' | 'discover-investors' | 'pitches-sent' | 'requests';

function buildInvestorQuery(filters: InvestorDirectoryFilters): string {
  const params = new URLSearchParams();
  if (filters.investor_type) params.set('investor_type', filters.investor_type);
  if (filters.sector) params.set('sector', filters.sector);
  if (filters.geography) params.set('geography', filters.geography);
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function FounderDashboard() {
  const [tab, setTab] = useState<Tab>('profile');

  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  const [connections, setConnections] = useState<ConnectionRequestRecord[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [decisionError, setDecisionError] = useState('');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<FounderAnalytics | null>(null);

  // Discover Investors
  const [investorFilters, setInvestorFilters] = useState<InvestorDirectoryFilters>({});
  const [investors, setInvestors] = useState<InvestorProfile[]>([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(true);
  const [composingForInvestor, setComposingForInvestor] = useState<string | null>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [pendingInvestorId, setPendingInvestorId] = useState<string | null>(null);
  const [pitchError, setPitchError] = useState('');

  // Pitches Sent (founder-initiated requests to investors)
  const [pitchesSent, setPitchesSent] = useState<ConnectionRequestRecord[]>([]);
  const [isLoadingPitchesSent, setIsLoadingPitchesSent] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FounderProfileFormData>({
    resolver: zodResolver(founderProfileSchema),
    defaultValues: { stage: 'idea', contact_visibility: 'private' },
  });

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const data = await apiGet<FounderProfile>('/api/v1/founder-profiles/me');
      setProfile(data);
      reset({
        startup_name: data.startup_name,
        tagline: data.tagline ?? '',
        description: data.description ?? '',
        sector: data.sector ?? '',
        stage: data.stage,
        funding_ask_min: data.funding_ask_min ?? undefined,
        funding_ask_max: data.funding_ask_max ?? undefined,
        location_country: data.location_country ?? '',
        location_city: data.location_city ?? '',
        pitch_deck_url: data.pitch_deck_url ?? '',
        demo_video_url: data.demo_video_url ?? '',
        profile_picture_url: data.profile_picture_url ?? '',
        gallery_image_urls_raw: (data.gallery_image_urls ?? []).join('\n'),
        startup_link: data.startup_link ?? '',
        contact_visibility: data.contact_visibility,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setProfile(null);
        setIsEditing(true); // no profile yet — go straight to the creation form
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [reset]);

  const loadConnections = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoadingConnections(true);
    try {
      const data = await apiGet<ConnectionRequestRecord[]>('/api/v1/connections/received');
      setConnections(data);
    } catch {
      // Non-critical for the page to function — the profile section still works on its own.
    } finally {
      if (!opts?.silent) setIsLoadingConnections(false);
    }
  }, []);

  const loadInvestors = useCallback(async () => {
    setIsLoadingInvestors(true);
    try {
      const data = await apiGet<InvestorProfile[]>(`/api/v1/investor-profiles${buildInvestorQuery(investorFilters)}`);
      setInvestors(data);
    } catch {
      // Keep the last successful list rather than clearing it on a transient failure.
    } finally {
      setIsLoadingInvestors(false);
    }
  }, [investorFilters]);

  const loadPitchesSent = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoadingPitchesSent(true);
    try {
      const data = await apiGet<ConnectionRequestRecord[]>('/api/v1/connections/sent');
      setPitchesSent(data);
    } catch {
      // non-critical
    } finally {
      if (!opts?.silent) setIsLoadingPitchesSent(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadConnections();
    loadPitchesSent();
    apiGet<FounderAnalytics>('/api/v1/analytics/founder').then(setAnalytics).catch(() => {
      // Non-critical — the rest of the dashboard works without it.
    });
  }, [loadProfile, loadConnections, loadPitchesSent]);

  useEffect(() => {
    loadInvestors();
  }, [loadInvestors]);

  // Without this, a request accepted/declined elsewhere (or a new incoming
  // request) never shows up while this dashboard stays open — same staleness
  // issue as the investor's "sent" tab (see InvestorDashboard.tsx). Silent so
  // the list doesn't flash back to a loading state on every poll tick.
  useEffect(() => {
    const interval = setInterval(() => {
      loadConnections({ silent: true });
      loadPitchesSent({ silent: true });
    }, 8000);
    return () => clearInterval(interval);
  }, [loadConnections, loadPitchesSent]);

  const onSubmit = async (data: FounderProfileFormData) => {
    setFormError('');
    try {
      const { gallery_image_urls_raw, ...rest } = data;
      const payload: FounderProfileInput = {
        ...rest,
        gallery_image_urls: galleryRawToArray(gallery_image_urls_raw),
      };
      const saved = await apiPut<FounderProfile>('/api/v1/founder-profiles/me', payload);
      setProfile(saved);
      setIsEditing(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save your profile. Please try again.');
    }
  };

  const togglePublish = async () => {
    if (!profile) return;
    setPublishError('');
    setIsTogglingPublish(true);
    try {
      const updated = await apiPatch<FounderProfile>(
        `/api/v1/founder-profiles/me/publish?published=${!profile.published}`
      );
      setProfile(updated);
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : 'Could not update publish status.');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const decideConnection = async (id: string, decision: 'accepted' | 'declined') => {
    setDecisionError('');
    setDecidingId(id);
    try {
      const updated = await apiPatch<ConnectionRequestRecord>(`/api/v1/connections/${id}`, {
        status: decision,
      });
      setConnections((current) => current.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setDecisionError(err instanceof ApiError ? err.message : 'Could not update this request.');
    } finally {
      setDecidingId(null);
    }
  };

  const sendPitch = async (investorUserId: string) => {
    setPitchError('');
    setPendingInvestorId(investorUserId);
    try {
      await apiPost('/api/v1/connections/to-investor', {
        investor_user_id: investorUserId,
        message: pitchMessage || undefined,
      });
      setComposingForInvestor(null);
      setPitchMessage('');
      loadPitchesSent();
    } catch (err) {
      setPitchError(err instanceof ApiError ? err.message : 'Could not send this pitch.');
    } finally {
      setPendingInvestorId(null);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'My Profile' },
    { id: 'discover-investors', label: 'Discover Investors' },
    { id: 'pitches-sent', label: 'Pitches Sent' },
    { id: 'requests', label: 'Connection Requests' },
  ];

  return (
    <div className="space-y-8">
      {/* Activity */}
      {analytics && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Profile views" value={analytics.profile_views_total} />
            <StatCard label="Connection requests" value={analytics.connection_requests_total} />
            <StatCard label="Saved by investors" value={analytics.saved_by_investors_count} />
            <StatCard label="Messages sent" value={analytics.messages_total} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActivityChart title="Profile views (30 days)" data={analytics.profile_views_daily} />
            <ActivityChart title="Connection requests (30 days)" data={analytics.connection_requests_daily} />
          </div>
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

      {tab === 'profile' && (
        <section className="rounded-card border border-borderColor bg-cardBg p-6 sm:p-8">
          {isLoadingProfile ? (
            <p className="text-secondaryText">Loading your profile...</p>
          ) : isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <h2 className="text-xl font-semibold">
                {profile ? 'Edit your startup profile' : 'Create your startup profile'}
              </h2>

              {formError && (
                <div className="rounded-[14px] border border-error bg-error/10 p-4 text-sm text-error">
                  {formError}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Startup Name</label>
                  <Input placeholder="e.g. Payflow" {...register('startup_name')} />
                  {errors.startup_name && <p className="mt-1 text-sm text-error">{errors.startup_name.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Tagline</label>
                  <Input placeholder="One line describing what you do" {...register('tagline')} />
                  {errors.tagline && <p className="mt-1 text-sm text-error">{errors.tagline.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Description</label>
                  <Textarea rows={4} placeholder="What are you building, and for whom?" {...register('description')} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Sector</label>
                  <Input placeholder="e.g. Fintech" {...register('sector')} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Stage</label>
                  <Select {...register('stage')}>
                    {STAGE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Funding Ask Min (USD)</label>
                  <Input type="number" min={0} placeholder="500000" {...register('funding_ask_min')} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Funding Ask Max (USD)</label>
                  <Input type="number" min={0} placeholder="2000000" {...register('funding_ask_max')} />
                  {errors.funding_ask_max && (
                    <p className="mt-1 text-sm text-error">{errors.funding_ask_max.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Country</label>
                  <Input placeholder="Nigeria" {...register('location_country')} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">City</label>
                  <Input placeholder="Lagos" {...register('location_city')} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Pitch Deck URL</label>
                  <Input placeholder="https://..." {...register('pitch_deck_url')} />
                  {errors.pitch_deck_url && <p className="mt-1 text-sm text-error">{errors.pitch_deck_url.message}</p>}
                </div>

                <MediaUploadField
                  kind="demo_video"
                  label="Demo Video"
                  value={watch('demo_video_url') ?? ''}
                  onChange={(url) => setValue('demo_video_url', url, { shouldDirty: true })}
                />

                <MediaUploadField
                  kind="profile_picture"
                  label="Profile Picture"
                  value={watch('profile_picture_url') ?? ''}
                  onChange={(url) => setValue('profile_picture_url', url, { shouldDirty: true })}
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Startup Link</label>
                  <Input placeholder="https://yourstartup.com" {...register('startup_link')} />
                  {errors.startup_link && <p className="mt-1 text-sm text-error">{errors.startup_link.message}</p>}
                  <p className="mt-1 text-xs text-secondaryText">Shown as a preview card on your profile.</p>
                </div>

                <div className="sm:col-span-2">
                  <GalleryUploadField
                    value={galleryRawToArray(watch('gallery_image_urls_raw'))}
                    onChange={(urls) => setValue('gallery_image_urls_raw', urls.join('\n'), { shouldDirty: true })}
                  />
                  {errors.gallery_image_urls_raw && (
                    <p className="mt-1 text-sm text-error">{errors.gallery_image_urls_raw.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-secondaryText">Contact Visibility</label>
                  <Select {...register('contact_visibility')}>
                    <option value="private">Private — reveal only after I accept a connection request</option>
                    <option value="public">Public — show my email on my profile</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
                {profile && (
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : profile ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {profile.profile_picture_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.startup_name}
                      className="h-16 w-16 shrink-0 rounded-full border border-borderColor object-cover"
                    />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">{profile.startup_name}</h2>
                      <Badge tone={profile.published ? 'success' : 'warning'}>
                        {profile.published ? 'Published' : 'Draft'}
                      </Badge>
                      <VerificationBadge tier={profile.verification_tier} />
                      <Link href="/billing" className="text-xs font-medium text-primaryBlue hover:underline">
                        {profile.verification_tier === 'basic' ? 'Upgrade' : 'Manage plan'}
                      </Link>
                    </div>
                    {profile.tagline && <p className="mt-2 text-secondaryText">{profile.tagline}</p>}
                    <p className="mt-1 text-sm text-secondaryText">
                      {STAGE_LABELS[profile.stage]}
                      {profile.sector ? ` · ${profile.sector}` : ''}
                      {profile.location_city ? ` · ${profile.location_city}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                  <Button size="sm" onClick={togglePublish} disabled={isTogglingPublish}>
                    {isTogglingPublish ? 'Updating...' : profile.published ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
              {publishError && <p className="mt-3 text-sm text-error">{publishError}</p>}
              {profile.description && <p className="mt-4 whitespace-pre-line text-secondaryText">{profile.description}</p>}

              {profile.startup_link && (
                <div className="mt-4">
                  <LinkPreviewCard url={profile.startup_link} />
                </div>
              )}

              {profile.demo_video_url && (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={profile.demo_video_url}
                  controls
                  className="mt-4 max-h-80 w-full rounded-input border border-borderColor"
                />
              )}

              {profile.gallery_image_urls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {profile.gallery_image_urls.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt={`${profile.startup_name} screenshot`}
                      className="h-32 w-full rounded-input border border-borderColor object-cover"
                    />
                  ))}
                </div>
              )}

              {!profile.published && (
                <p className="mt-4 text-sm text-secondaryText">
                  Your profile is a draft — investors can&apos;t discover it until you publish.
                </p>
              )}
            </div>
          ) : null}
        </section>
      )}

      {tab === 'discover-investors' && (
        <section className="space-y-5">
          <div className="grid gap-3 rounded-card border border-borderColor bg-cardBg p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search investors..."
              className="lg:col-span-2"
              value={investorFilters.search ?? ''}
              onChange={(e) => setInvestorFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            />
            <Select
              value={investorFilters.investor_type ?? ''}
              onChange={(e) =>
                setInvestorFilters((f) => ({
                  ...f,
                  investor_type: (e.target.value || undefined) as InvestorProfile['investor_type'],
                }))
              }
            >
              <option value="">All investor types</option>
              {INVESTOR_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Sector of interest"
              value={investorFilters.sector ?? ''}
              onChange={(e) => setInvestorFilters((f) => ({ ...f, sector: e.target.value || undefined }))}
            />
          </div>

          {pitchError && (
            <div className="rounded-[14px] border border-error bg-error/10 p-4 text-sm text-error">{pitchError}</div>
          )}

          {isLoadingInvestors ? (
            <p className="text-secondaryText">Loading investors...</p>
          ) : investors.length === 0 ? (
            <p className="text-secondaryText">No investors match these filters yet.</p>
          ) : (
            <ul className="space-y-4">
              {investors.map((investor) => (
                <li key={investor.id} className="rounded-input border border-borderColor bg-secondaryBg p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {investor.profile_picture_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={investor.profile_picture_url}
                          alt={investor.firm_name ?? 'Investor'}
                          className="h-12 w-12 shrink-0 rounded-full border border-borderColor object-cover"
                        />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{investor.firm_name ?? INVESTOR_TYPE_LABELS[investor.investor_type]}</h3>
                          <Badge tone="info">{INVESTOR_TYPE_LABELS[investor.investor_type]}</Badge>
                        </div>
                        {investor.bio && <p className="mt-1 text-sm text-secondaryText">{investor.bio}</p>}
                        <p className="mt-1 text-xs text-secondaryText">
                          {investor.sectors_of_interest.length > 0 ? investor.sectors_of_interest.join(', ') : ''}
                          {investor.check_size_min || investor.check_size_max
                            ? ` · Check size $${(investor.check_size_min ?? 0).toLocaleString()}–$${(investor.check_size_max ?? 0).toLocaleString()}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setComposingForInvestor(composingForInvestor === investor.user_id ? null : investor.user_id)}
                    >
                      Pitch
                    </Button>
                  </div>

                  {investor.contact && (
                    <p className="mt-3 text-sm text-success">Contact unlocked: {investor.contact.email}</p>
                  )}

                  {composingForInvestor === investor.user_id && (
                    <div className="mt-4 space-y-3 border-t border-borderColor pt-4">
                      <Textarea
                        rows={3}
                        placeholder="Introduce your startup and why this investor is a fit (optional)"
                        value={pitchMessage}
                        onChange={(e) => setPitchMessage(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <Button size="sm" onClick={() => sendPitch(investor.user_id)} disabled={pendingInvestorId === investor.user_id}>
                          {pendingInvestorId === investor.user_id ? 'Sending...' : 'Send Pitch'}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setComposingForInvestor(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'pitches-sent' && (
        <section className="rounded-card border border-borderColor bg-cardBg p-6 sm:p-8">
          <h2 className="mb-4 text-xl font-semibold">Pitches Sent to Investors</h2>
          {isLoadingPitchesSent ? (
            <p className="text-secondaryText">Loading...</p>
          ) : pitchesSent.length === 0 ? (
            <p className="text-secondaryText">You haven&apos;t pitched any investors yet — try Discover Investors.</p>
          ) : (
            <ul className="space-y-4">
              {pitchesSent.map((pitch) => (
                <li key={pitch.id} className="rounded-input border border-borderColor bg-secondaryBg p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{pitch.investor_email ?? 'An investor'}</p>
                    <Badge
                      tone={pitch.status === 'accepted' ? 'success' : pitch.status === 'declined' ? 'error' : 'warning'}
                    >
                      {pitch.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-secondaryText">Sent {new Date(pitch.created_at).toLocaleDateString()}</p>
                  {pitch.status === 'accepted' && (
                    <div className="mt-3">
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

      {tab === 'requests' && (
        <section className="rounded-card border border-borderColor bg-cardBg p-6 sm:p-8">
          <h2 className="mb-4 text-xl font-semibold">Connection Requests</h2>
          {decisionError && <p className="mb-3 text-sm text-error">{decisionError}</p>}

          {isLoadingConnections ? (
            <p className="text-secondaryText">Loading requests...</p>
          ) : connections.length === 0 ? (
            <p className="text-secondaryText">No connection requests yet.</p>
          ) : (
            <ul className="space-y-4">
              {connections.map((connection) => (
                <li
                  key={connection.id}
                  className="rounded-input border border-borderColor bg-secondaryBg p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{connection.investor_email ?? 'An investor'}</p>
                      <p className="text-xs text-secondaryText">
                        {new Date(connection.created_at).toLocaleDateString()}
                      </p>
                    </div>
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
                  {connection.message && <p className="mt-3 text-sm text-secondaryText">{connection.message}</p>}
                  {connection.status === 'pending' && (
                    <div className="mt-4 flex gap-3">
                      <Button size="sm" onClick={() => decideConnection(connection.id, 'accepted')} disabled={decidingId === connection.id}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => decideConnection(connection.id, 'declined')}
                        disabled={decidingId === connection.id}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                  {connection.status === 'accepted' && (
                    <div className="mt-4">
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
        </section>
      )}
    </div>
  );
}
