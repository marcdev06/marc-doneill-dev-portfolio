import { parseContent, siteSchema } from '@/lib/content';

export const site = parseContent(
  siteSchema,
  {
    name: 'Marc Doneill Balatayo',
    homeTitle: 'Marc Doneill Balatayo · Full-Stack Software Engineer',
    description:
      '4+ years building web apps end to end: React and Next.js front ends, Spring Boot and GraphQL APIs, and the PostgreSQL databases behind them.',
    repository: {
      label: 'Built with Next.js + Bootstrap',
      href: 'https://github.com/marcdev06/marc-doneill-dev-portfolio',
    },
    designCredit: {
      label: 'Design inspired by Motionfolio by Saba Rezaeian (CC BY 4.0)',
      href: 'https://www.figma.com/community/file/1690280357896220844/motionfolio-modern-portfolio-landing-page',
    },
    navigationLinks: [
      { label: 'Experience', href: '/#experience' },
      { label: 'About', href: '/#about' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  'src/content/site.ts',
);
