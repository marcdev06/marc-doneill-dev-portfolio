import { z } from 'zod';
import { isoMonthSchema } from './iso-month';
import { httpsUrlSchema, requiredText } from './shared-schemas';

const roleSchema = z
  .object({
    title: requiredText('Role title'),
    employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).optional(),
    start: isoMonthSchema,
    end: isoMonthSchema.optional(),
  })
  .refine((role) => role.end === undefined || role.end >= role.start, {
    error: 'A role cannot end before it starts',
    path: ['end'],
  });

const experienceEntrySchema = z.object({
  company: requiredText('Company'),
  companyUrl: httpsUrlSchema.optional(),
  context: requiredText('Company context').optional(),
  roles: z.array(roleSchema).min(1, 'Add at least one role'),
  bullets: z
    .array(requiredText('Bullet'))
    .min(1, 'Add at least one bullet')
    .max(4, 'Keep experience entries to at most 4 bullets'),
  hasLeadership: z.boolean().optional(),
});

export const experienceSchema = z.array(experienceEntrySchema).min(1, 'Add at least one company');

export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type ExperienceRole = ExperienceEntry['roles'][number];
