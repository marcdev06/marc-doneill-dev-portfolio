import { homeSchema, parseContent } from '@/lib/content';

export const home = parseContent(
  homeSchema,
  {
    hero: {
      greeting: "Hi, I'm Marc Doneill Balatayo",
      headline: {
        beforeHighlight: 'Building software that makes life easier for ',
        highlight: 'every Filipino',
        afterHighlight: '.',
      },
      typewriter: {
        prefix: "I'm a",
        phrases: [
          'full-stack software engineer.',
          'Spring Boot & GraphQL developer.',
          'React & Next.js developer.',
        ],
      },
      evidence: [
        { text: 'Mid-Level Full-Stack Software Engineer at ' },
        { text: 'KwikCare', href: 'https://kwik.care/kwikcare' },
        { text: ", building its HMO platform. Before that: Singlife's Policy Admin System." },
      ],
      lead: '4+ years building web apps end to end: React and Next.js front ends, Spring Boot and GraphQL APIs, and the PostgreSQL databases behind them.',
      primaryAction: { label: 'Work with me', href: '#contact' },
      secondaryAction: { label: 'See experience', href: '#experience' },
    },
    experience: { heading: 'Experience' },
    skills: { heading: 'Skills' },
    education: { heading: 'Education' },
    about: {
      heading: 'About',
      paragraph:
        "I'm a full-stack engineer based in Taguig City. At KwikCare, a health care plan (HMO) provider, I work across the stack with Spring Boot, JHipster, React, Next.js and GraphQL. Before that I spent over two years at Singlife Philippines, building features for its Policy Admin System and doing a stint as production tech support, fixing live issues. I started at Workbean, an employer branding company, where I went from intern to software engineer and owned the backend service behind its product. I enjoy building apps and systems that make everyday life easier, and I also take on freelance, contract and part-time projects. Right now I'm learning how to get the most out of AI in my development workflow.",
      howIWork: {
        heading: 'How I work',
        text: 'I document what I build, test before I hand work off, and work as well on my own as in a team.',
      },
    },
    contact: {
      heading: "Let's build something",
      resumeLabel: 'Download resume',
    },
  },
  'src/content/home.ts',
);
