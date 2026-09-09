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

const optionalUrl = z.string().url('Enter a valid URL').optional().or(z.literal(''));

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
    pitch_deck_url: optionalUrl,
    demo_video_url: optionalUrl,
    profile_picture_url: optionalUrl,
    // Textarea, one URL per line — kept as a single string in the form and
    // split/validated on submit (see founderProfileFormToInput below),
    // since react-hook-form + a dynamic array of URL inputs is a lot more
    // UI for the same result at MVP stage.
    gallery_image_urls_raw: z.string().optional().or(z.literal('')),
    startup_link: optionalUrl,
    contact_visibility: z.enum(['private', 'public']),
  })
  .refine(
    (data) =>
      data.funding_ask_min === undefined ||
      data.funding_ask_max === undefined ||
      data.funding_ask_max >= data.funding_ask_min,
    { message: 'Maximum ask cannot be less than minimum ask', path: ['funding_ask_max'] }
  )
  .refine(
    (data) => {
      const lines = (data.gallery_image_urls_raw ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 6) return false;
      return lines.every((l) => z.string().url().safeParse(l).success);
    },
    { message: 'Gallery: up to 6 image URLs, one per line, each a valid URL', path: ['gallery_image_urls_raw'] }
  );

export type FounderProfileFormData = z.infer<typeof founderProfileSchema>;

/** Converts the form's newline-delimited gallery string into the array the API expects. */
export function galleryRawToArray(raw: string | undefined): string[] {
  return (raw ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
}
