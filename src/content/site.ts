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
      'Marc Doneill Balatayo, Full-Stack Software Engineer: Building software that makes everyday life easier.',
    resumePage: {
      documentTitle: 'Marc Doneill Balatayo – CV',
      headings: { contact: 'Contact', about: 'About me' },
    },
    resumeReview: {
      title: 'Resume request',
      labels: {
        name: 'Name',
        email: 'Email',
        note: 'Note',
        country: 'Country',
        requestedAt: 'Requested',
        decideBy: 'Decide by',
        status: 'Status',
      },
      emptyValue: 'Not given',
      statusLabels: {
        pending: 'Waiting for your decision',
        approved: 'Approved. The download starts in their window.',
        denied: 'Denied. They see a polite message.',
        expired: 'Expired. Their window stopped waiting.',
      },
      approveLabel: 'Approve',
      denyLabel: 'Deny',
      expiredMessage: 'This request expired before you decided. Reply by email instead:',
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
