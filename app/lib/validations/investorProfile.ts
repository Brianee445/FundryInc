import { z } from 'zod';

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.coerce.number().min(0).optional()
);

export const investorProfileSchema = z
  .object({
    investor_type: z.enum(['angel', 'vc', 'fund', 'family_office', 'other']),
    firm_name: z.string().max(140).optional().or(z.literal('')),
    bio: z.string().max(2000).optional().or(z.literal('')),
    check_size_min: optionalNumber,
    check_size_max: optionalNumber,
    // Comma-separated, mirroring the gallery textarea pattern elsewhere —
    // split into an array on submit (see tagsToArray below).
    sectors_of_interest_raw: z.string().optional().or(z.literal('')),
    geographies_of_interest_raw: z.string().optional().or(z.literal('')),
    profile_picture_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    linkedin_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    contact_visibility: z.enum(['private', 'public']),
  })
  .refine(
    (data) =>
      data.check_size_min === undefined ||
      data.check_size_max === undefined ||
      data.check_size_max >= data.check_size_min,
    { message: 'Maximum check size cannot be less than minimum', path: ['check_size_max'] }
  )
  .refine((data) => tagsToArray(data.sectors_of_interest_raw).length <= 10, {
    message: 'Up to 10 sectors',
    path: ['sectors_of_interest_raw'],
  })
  .refine((data) => tagsToArray(data.geographies_of_interest_raw).length <= 10, {
    message: 'Up to 10 geographies',
    path: ['geographies_of_interest_raw'],
  });

export type InvestorProfileFormData = z.infer<typeof investorProfileSchema>;

/** Converts a comma-separated form string into the trimmed array the API expects. */
export function tagsToArray(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((t) => t.trim()).filter(Boolean);
}
