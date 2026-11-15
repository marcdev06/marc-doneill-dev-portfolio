import { z } from 'zod';
import { requiredText } from './shared-schemas';

export const skillTierIds = ['core', 'comfortable', 'past'] as const;

export const skillGroupNames = [
  'Languages',
  'Front end',
  'Front end / mobile',
  'Back end',
  'Data',
  'Cloud/DevOps',
  'Testing',
  'Other',
] as const;

const skillGroupSchema = z.object({
  group: z.enum(skillGroupNames, { error: `Use one of: ${skillGroupNames.join(', ')}` }),
  names: z.array(requiredText('Skill name')).min(1, 'A skill group needs at least one skill'),
});

const skillTierSchema = z.object({
  label: requiredText('Tier label'),
  summary: requiredText('Tier summary').optional(),
  groups: z.array(skillGroupSchema).min(1, 'A tier needs at least one group'),
});

export const skillsSchema = z
  .object({
    core: skillTierSchema,
    comfortable: skillTierSchema,
    past: skillTierSchema,
  })
  .superRefine((skills, context) => {
    const seenSkillNames = new Set<string>();
    for (const tierId of skillTierIds) {
      for (const skillName of skills[tierId].groups.flatMap((skillGroup) => skillGroup.names)) {
        if (seenSkillNames.has(skillName)) {
          context.addIssue({
            code: 'custom',
            message: `"${skillName}" appears in more than one place`,
            path: [tierId],
          });
        }
        seenSkillNames.add(skillName);
      }
    }
  });

export type Skills = z.infer<typeof skillsSchema>;
export type SkillTierId = (typeof skillTierIds)[number];
export type SkillTier = Skills[SkillTierId] & { id: SkillTierId };

export function listSkillTiers(skills: Skills): SkillTier[] {
  return skillTierIds.map((tierId) => ({ id: tierId, ...skills[tierId] }));
}
