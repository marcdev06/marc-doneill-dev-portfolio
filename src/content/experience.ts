import { experienceSchema, parseContent } from '@/lib/content';

export const experience = parseContent(
  experienceSchema,
  [
    {
      company: 'KwikCare',
      companyUrl: 'https://kwik.care/kwikcare',
      context: 'A health care plan (HMO) provider',
      roles: [{ title: 'Mid-Level Full-Stack Software Engineer', start: '2025-09' }],
      bullets: [
        "Build and maintain KwikCare's health care plan (HMO) platform across the stack: Spring Boot and JHipster services, GraphQL, React/Next.js front ends and PostgreSQL.",
      ],
    },
    {
      company: 'Singlife Philippines',
      roles: [{ title: 'Software Engineer', start: '2023-03', end: '2025-07' }],
      bullets: [
        "Built features for, maintained and improved Singlife's Policy Admin System.",
        'Served as Production Tech Support, where investigating and fixing production issues came first.',
        'Worked across Node.js/Express and ASP.NET Core (C#) services, PostgreSQL, AWS services and Solidity smart contracts.',
      ],
    },
    {
      company: 'Workbean',
      context: 'An employer branding company',
      roles: [
        {
          title: 'Software Engineer',
          employmentType: 'Full-time',
          start: '2022-06',
          end: '2023-03',
        },
        {
          title: 'Software Engineer Intern',
          employmentType: 'Internship',
          start: '2022-03',
          end: '2022-06',
        },
      ],
      bullets: [
        "Owned the backend service of Workbean's employer branding product, built with Flask (Python) on Amazon QLDB and DynamoDB.",
        'Developed web and mobile app features with Vue and Ionic.',
        'Debugged, improved and documented existing systems.',
      ],
    },
  ],
  'src/content/experience.ts',
);
