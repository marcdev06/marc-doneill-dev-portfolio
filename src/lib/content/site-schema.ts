import { z } from 'zod';
import { httpsUrlSchema, linkSchema, requiredText } from './shared-schemas';

export const siteSchema = z.object({
  name: requiredText('Site name'),
  homeTitle: requiredText('Home page title'),
  description: requiredText('Site description'),
  locale: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/, 'Locale reads like en_PH'),
  openGraphImageAlt: requiredText('Open Graph image alt text'),
  resumePage: z.object({
    title: requiredText('Resume page title'),
    description: requiredText('Resume page description'),
  }),
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
