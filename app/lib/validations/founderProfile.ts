import { z } from 'zod';

/**
 * react-hook-form gives us an empty string for an untouched number input,
 * not undefined. Without this preprocessing step, z.coerce.number() turns
 * that empty string into 0 — silently sending "$0 minimum ask" instead of
 * "no minimum specified" whenever the field is left blank.
 */
const optionalNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.coerce.number().min(0).optional()
);

export const founderProfileSchema = z
  .object({
    startup_name: z.string().min(2, 'Startup name is required'),
    tagline: z.string().max(140, 'Keep it under 140 characters').optional().or(z.literal('')),
    description: z.string().max(2000).optional().or(z.literal('')),
    sector: z.string().optional().or(z.literal('')),
    stage: z.enum(['idea', 'preseed', 'seed', 'series_a', 'series_b_plus']),
    funding_ask_min: optionalNumber,
    funding_ask_max: optionalNumber,
    location_country: z.string().optional().or(z.literal('')),
    location_city: z.string().optional().or(z.literal('')),
    pitch_deck_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    demo_video_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    contact_visibility: z.enum(['private', 'public']),
  })
  .refine(
    (data) =>
      data.funding_ask_min === undefined ||
      data.funding_ask_max === undefined ||
      data.funding_ask_max >= data.funding_ask_min,
    { message: 'Maximum ask cannot be less than minimum ask', path: ['funding_ask_max'] }
  );

export type FounderProfileFormData = z.infer<typeof founderProfileSchema>;
