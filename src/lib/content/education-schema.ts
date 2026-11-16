import { z } from 'zod';
import { requiredText } from './shared-schemas';

const yearSchema = z.number().int().min(1900).max(2100);

const educationEntrySchema = z
  .object({
    degree: requiredText('Degree'),
    school: requiredText('School'),
    city: requiredText('City'),
    startYear: yearSchema,
    endYear: yearSchema,
  })
  .refine((entry) => entry.endYear >= entry.startYear, {
    error: 'Education cannot end before it starts',
    path: ['endYear'],
  });

export const educationSchema = z.array(educationEntrySchema).min(1, 'Add at least one degree');

export type EducationEntry = z.infer<typeof educationEntrySchema>;
