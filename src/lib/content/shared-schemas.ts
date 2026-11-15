import { z } from 'zod';

export function requiredText(fieldLabel: string) {
  return z.string().regex(/\S/, `${fieldLabel} is required`);
}

export const httpsUrlSchema = z.url({
  protocol: /^https$/,
  error: 'Use an absolute https:// URL',
});

export const sitePathSchema = z
  .string()
  .regex(/^\/[\w./#-]*$/, 'Use a site-relative path that starts with "/"');

export const linkSchema = z.object({
  label: requiredText('Link label'),
  href: z.union([httpsUrlSchema, sitePathSchema, z.string().regex(/^#[a-z-]+$/)], {
    error: 'Use an https:// URL, a site path or a "#section" anchor',
  }),
});

export const textSegmentSchema = z.object({
  text: z.string().min(1, 'Text segments cannot be empty'),
  href: httpsUrlSchema.optional(),
});

export const richTextSchema = z.array(textSegmentSchema).min(1, 'Add at least one text segment');

export type ContentLink = z.infer<typeof linkSchema>;
export type TextSegment = z.infer<typeof textSegmentSchema>;
