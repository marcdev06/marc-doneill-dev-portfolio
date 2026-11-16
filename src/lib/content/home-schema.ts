import { z } from 'zod';
import { linkSchema, requiredText, richTextSchema } from './shared-schemas';

const sectionHeadingSchema = z.object({
  heading: requiredText('Section heading'),
});

const formFieldCopySchema = z.object({
  label: requiredText('Form field label'),
  error: requiredText('Form field error message'),
});

const linkedMessageSchema = z.object({
  beforeLink: requiredText('Message text before the link'),
  linkLabel: requiredText('Message link label'),
  afterLink: z.string(),
});

const resumeRequestCopySchema = z.object({
  triggerLabel: requiredText('Resume request button label'),
  title: requiredText('Resume request dialog title'),
  intro: requiredText('Resume request intro'),
  closeLabel: requiredText('Close button label'),
  fields: z.object({
    name: formFieldCopySchema,
    email: formFieldCopySchema,
    note: formFieldCopySchema,
  }),
  honeypotLabel: requiredText('Honeypot label'),
  privacyNote: requiredText('Privacy note'),
  submitLabel: requiredText('Submit label'),
  pendingLabel: requiredText('Pending label'),
  waitingMessage: requiredText('Waiting message'),
  approvedMessage: requiredText('Approved message'),
  downloadLabel: requiredText('Download link label'),
  deniedMessage: requiredText('Denied message'),
  expiredMessage: requiredText('Expired message'),
  rateLimitedMessage: requiredText('Rate-limited message'),
  failureMessage: requiredText('Failure message'),
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
    form: z.object({
      fields: z.object({
        name: formFieldCopySchema,
        email: formFieldCopySchema,
        message: formFieldCopySchema,
      }),
      honeypotLabel: requiredText('Honeypot label'),
      submitLabel: requiredText('Submit label'),
      pendingLabel: requiredText('Pending label'),
      privacyNote: requiredText('Privacy note'),
      successMessage: requiredText('Success message'),
      failureMessage: linkedMessageSchema,
    }),
    resumeRequest: resumeRequestCopySchema,
  }),
});

export type HomeContent = z.infer<typeof homeSchema>;
export type HeroContent = HomeContent['hero'];
export type ContactFormCopy = HomeContent['contact']['form'];
export type ResumeRequestCopy = HomeContent['contact']['resumeRequest'];
