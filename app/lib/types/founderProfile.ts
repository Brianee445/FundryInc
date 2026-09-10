export type Stage = 'idea' | 'preseed' | 'seed' | 'series_a' | 'series_b_plus';
export type VerificationTier = 'basic' | 'business_verified' | 'investor_ready';
export type ContactVisibility = 'private' | 'public';

export const STAGE_LABELS: Record<Stage, string> = {
  idea: 'Idea',
  preseed: 'Pre-seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b_plus: 'Series B+',
};

export const VERIFICATION_LABELS: Record<VerificationTier, string> = {
  basic: 'Basic',
  business_verified: 'Business Verified',
  investor_ready: 'Investor-Ready',
};

export interface FounderContact {
  email: string;
}

export interface FounderProfile {
  id: string;
  user_id: string;
  startup_name: string;
  tagline: string | null;
  description: string | null;
  sector: string | null;
  stage: Stage;
  funding_ask_min: number | null;
  funding_ask_max: number | null;
  location_country: string | null;
  location_city: string | null;
  pitch_deck_url: string | null;
  demo_video_url: string | null;
  profile_picture_url: string | null;
  gallery_image_urls: string[];
  startup_link: string | null;
  contact_visibility: ContactVisibility;
  verification_tier: VerificationTier;
  published: boolean;
  is_spotlighted: boolean;
  created_at: string;
  contact: FounderContact | null;
  is_saved: boolean | null;
}

/** Payload for the create/update upsert — mirrors FounderProfileUpsert on the backend. */
export interface FounderProfileInput {
  startup_name: string;
  tagline?: string;
  description?: string;
  sector?: string;
  stage: Stage;
  funding_ask_min?: number;
  funding_ask_max?: number;
  location_country?: string;
  location_city?: string;
  pitch_deck_url?: string;
  demo_video_url?: string;
  profile_picture_url?: string;
  gallery_image_urls?: string[];
  startup_link?: string;
  contact_visibility: ContactVisibility;
}

export interface FounderDirectoryFilters {
  sector?: string;
  stage?: Stage | '';
  funding_min?: number;
  funding_max?: number;
  search?: string;
}

/** Response shape from GET /api/v1/link-preview?url=... */
export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
}
