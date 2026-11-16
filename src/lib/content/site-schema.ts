import { z } from 'zod';
import { httpsUrlSchema, linkSchema, requiredText } from './shared-schemas';

const resumeReviewSchema = z.object({
  title: requiredText('Resume review page title'),
  labels: z.object({
    name: requiredText('Name label'),
    email: requiredText('Email label'),
    note: requiredText('Note label'),
    country: requiredText('Country label'),
    requestedAt: requiredText('Requested-at label'),
    decideBy: requiredText('Decide-by label'),
    status: requiredText('Status label'),
  }),
  emptyValue: requiredText('Empty value text'),
  statusLabels: z.object({
    pending: requiredText('Pending status label'),
    approved: requiredText('Approved status label'),
    denied: requiredText('Denied status label'),
    expired: requiredText('Expired status label'),
  }),
  approveLabel: requiredText('Approve button label'),
  denyLabel: requiredText('Deny button label'),
  expiredMessage: requiredText('Expired message'),
});

export const siteSchema = z.object({
  name: requiredText('Site name'),
  homeTitle: requiredText('Home page title'),
  description: requiredText('Site description'),
  locale: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/, 'Locale reads like en_PH'),
  openGraphImageAlt: requiredText('Open Graph image alt text'),
  resumePage: z.object({
    documentTitle: requiredText('Resume document title'),
    headings: z.object({
      contact: requiredText('Resume contact heading'),
      about: requiredText('Resume about heading'),
    }),
  }),
  resumeReview: resumeReviewSchema,
  repository: linkSchema.extend({ href: httpsUrlSchema }),
  navigationLinks: z
    .array(
      linkSchema.extend({
        href: z.string().regex(/^\/#[a-z-]+$/, 'Navigation links point at "/#section" anchors'),
      }),
    )
    .min(1, 'Add at least one navigation link'),
});

export type SiteContent = z.infer<typeof siteSchema>;
export type NavigationLink = SiteContent['navigationLinks'][number];
export type ResumeReviewCopy = SiteContent['resumeReview'];
