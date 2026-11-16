import { parseContent, profileSchema } from '@/lib/content';

export const profile = parseContent(
  profileSchema,
  {
    name: 'Marc Doneill Balatayo',
    shortName: 'Marc Balatayo',
    monogram: 'MB',
    title: 'Full-Stack Software Engineer',
    location: 'Taguig City, PH',
    timeZoneLabel: 'Manila time (UTC+8)',
    availability: {
      headline: 'Open to freelance & contract work',
      detail: 'Open to freelance, contract, part-time and flexible work.',
    },
    links: {
      github: 'https://github.com/marcdev06',
      linkedin: 'https://www.linkedin.com/in/marcdev06',
    },
    resumeFileName: 'Marc_Doneill_Balatayo_CV.pdf',
    photo: {
      src: '/images/profile-photo.jpg',
      alt: 'Portrait of Marc Doneill Balatayo',
      width: 957,
      height: 960,
    },
  },
  'src/content/profile.ts',
);
