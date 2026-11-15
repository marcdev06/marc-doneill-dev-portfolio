import { z } from 'zod';
import { linkSchema, requiredText, richTextSchema } from './shared-schemas';

const sectionHeadingSchema = z.object({
  heading: requiredText('Section heading'),
});

export const homeSchema = z.object({
  hero: z.object({
    greeting: requiredText('Hero greeting'),
    headline: z.object({
      beforeHighlight: requiredText('Headline text before the highlight'),
      highlight: requiredText('Headline highlight'),
      afterHighlight: z.string(),
    }),
    typewriter: z.object({
      prefix: requiredText('Typewriter prefix'),
      phrases: z.tuple([requiredText('Typewriter phrase')], requiredText('Typewriter phrase')),
    }),
    evidence: richTextSchema,
    lead: requiredText('Hero lead'),
    primaryAction: linkSchema,
    secondaryAction: linkSchema,
  }),
  experience: sectionHeadingSchema,
  skills: sectionHeadingSchema,
  education: sectionHeadingSchema,
  about: sectionHeadingSchema.extend({
    paragraph: requiredText('About paragraph'),
    howIWork: z.object({
      heading: requiredText('How I work heading'),
      text: requiredText('How I work text'),
    }),
  }),
  contact: sectionHeadingSchema.extend({
    resumeLabel: requiredText('Resume link label'),
  }),
});

export type HomeContent = z.infer<typeof homeSchema>;
export type HeroContent = HomeContent['hero'];
