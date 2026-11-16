import { educationSchema, parseContent } from '@/lib/content';

export const education = parseContent(
  educationSchema,
  [
    {
      degree: 'Bachelor of Science in Information Technology',
      school: 'University of Science and Technology of Southern Philippines',
      city: 'Cagayan de Oro City',
      startYear: 2018,
      endYear: 2022,
    },
  ],
  'src/content/education.ts',
);
