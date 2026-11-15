import { z } from 'zod';
import { httpsUrlSchema, linkSchema, requiredText } from './shared-schemas';

export const siteSchema = z.object({
  name: requiredText('Site name'),
  homeTitle: requiredText('Home page title'),
  description: requiredText('Site description'),
  repository: linkSchema.extend({ href: httpsUrlSchema }),
  designCredit: linkSchema.extend({ href: httpsUrlSchema }),
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
