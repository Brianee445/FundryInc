import type { VerificationTier } from '@/app/lib/types/founderProfile';

export type InvestorType = 'angel' | 'vc' | 'fund' | 'family_office' | 'other';
export type ContactVisibility = 'private' | 'public';

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  angel: 'Angel Investor',
  vc: 'Venture Capital',
  fund: 'Fund',
  family_office: 'Family Office',
  other: 'Other',
};

export interface InvestorContact {
  email: string;
}

export interface InvestorProfile {
  id: string;
  user_id: string;
  investor_type: InvestorType;
  firm_name: string | null;
  bio: string | null;
  check_size_min: number | null;
  check_size_max: number | null;
  sectors_of_interest: string[];
  geographies_of_interest: string[];
  profile_picture_url: string | null;
  linkedin_url: string | null;
  contact_visibility: ContactVisibility;
  verification_tier: VerificationTier;
  published: boolean;
  created_at: string;
  contact: InvestorContact | null;
}

/** Payload for the create/update upsert — mirrors InvestorProfileUpsert on the backend. */
export interface InvestorProfileInput {
  investor_type: InvestorType;
  firm_name?: string;
  bio?: string;
  check_size_min?: number;
  check_size_max?: number;
  sectors_of_interest?: string[];
  geographies_of_interest?: string[];
  profile_picture_url?: string;
  linkedin_url?: string;
  contact_visibility: ContactVisibility;
}

export interface InvestorDirectoryFilters {
  investor_type?: InvestorType | '';
  sector?: string;
  geography?: string;
  search?: string;
}
