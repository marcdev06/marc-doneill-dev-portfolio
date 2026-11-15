import { parseContent, siteSchema } from '@/lib/content';

export const site = parseContent(
  siteSchema,
  {
    name: 'Marc Doneill Balatayo',
    homeTitle: 'Marc Doneill Balatayo · Full-Stack Software Engineer',
    description:
      '4+ years building web apps end to end: React and Next.js front ends, Spring Boot and GraphQL APIs, and the PostgreSQL databases behind them.',
    locale: 'en_PH',
    openGraphImageAlt:
      'Marc Doneill Balatayo, Full-Stack Software Engineer: Building software that makes life easier for every Filipino.',
    resumePage: {
      title: 'Resume',
      description:
        'The one-page resume of Marc Doneill Balatayo, a full-stack software engineer in Taguig City, PH: experience, skills and education, with a PDF download.',
    },
    repository: {
      label: 'Built with Next.js + Bootstrap',
      href: 'https://github.com/marcdev06/marc-doneill-dev-portfolio',
    },
    navigationLinks: [
      { label: 'Experience', href: '/#experience' },
      { label: 'About', href: '/#about' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  'src/content/site.ts',
);
