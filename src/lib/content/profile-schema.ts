import { z } from 'zod';
import { httpsUrlSchema, requiredText, sitePathSchema } from './shared-schemas';

export const profileSchema = z.object({
  name: requiredText('Name'),
  shortName: requiredText('Short name'),
  monogram: z.string().regex(/^[A-Z]{2}$/, 'Monogram must be two capital letters'),
  title: requiredText('Title'),
  location: z
    .string()
    .regex(/^[^,]+, [A-Z]{2}$/, 'Location reads "City, CC" with a two-letter country code'),
  timeZoneLabel: requiredText('Time zone label'),
  availability: z.object({
    headline: requiredText('Availability headline'),
    detail: requiredText('Availability detail'),
  }),
  email: z.email('Email must be a valid address'),
  links: z.object({
    github: httpsUrlSchema,
    linkedin: httpsUrlSchema,
  }),
  resumePath: sitePathSchema.regex(/\.pdf$/, 'Resume path must end in .pdf'),
  photo: z.object({
    src: sitePathSchema,
    alt: requiredText('Photo alt text'),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

export type Profile = z.infer<typeof profileSchema>;
