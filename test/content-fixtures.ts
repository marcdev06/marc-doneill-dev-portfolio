import type { z } from 'zod';
import type {
  educationSchema,
  experienceSchema,
  homeSchema,
  profileSchema,
  siteSchema,
  skillsSchema,
} from '@/lib/content';

export function buildSiteInput(): z.input<typeof siteSchema> {
  return {
    name: 'Ada Example',
    homeTitle: 'Ada Example · Engineer',
    description: 'Builds dependable web apps.',
    repository: { label: 'Source', href: 'https://example.com/source' },
    designCredit: { label: 'Credit', href: 'https://example.com/credit' },
    navigationLinks: [{ label: 'Experience', href: '/#experience' }],
  };
}

export function buildProfileInput(): z.input<typeof profileSchema> {
  return {
    name: 'Ada Example',
    shortName: 'Ada E.',
    monogram: 'AE',
    title: 'Software Engineer',
    location: 'Example City',
    timeZoneLabel: 'Example time (UTC+0)',
    availability: { headline: 'Open to contracts', detail: 'Open to contract work.' },
    email: 'ada@example.com',
    links: { github: 'https://github.com/ada', linkedin: 'https://www.linkedin.com/in/ada' },
    resumePath: '/resume.pdf',
    photo: { src: '/images/ada.jpg', alt: 'Portrait of Ada', width: 400, height: 400 },
  };
}

export function buildHomeInput(): z.input<typeof homeSchema> {
  return {
    hero: {
      greeting: "Hi, I'm Ada",
      headline: { beforeHighlight: 'Building ', highlight: 'calm software', afterHighlight: '.' },
      typewriter: { prefix: "I'm a", phrases: ['software engineer.', 'React developer.'] },
      evidence: [{ text: 'Engineer at ' }, { text: 'Example', href: 'https://example.com' }],
      lead: 'Five years of web apps.',
      primaryAction: { label: 'Work with me', href: '#contact' },
      secondaryAction: { label: 'See experience', href: '#experience' },
    },
    experience: { heading: 'Experience' },
    skills: { heading: 'Skills' },
    education: { heading: 'Education' },
    about: {
      heading: 'About',
      paragraph: 'I build things.',
      howIWork: { heading: 'How I work', text: 'Carefully.' },
    },
    contact: {
      heading: "Let's talk",
      resumeLabel: 'Download resume',
      form: buildContactFormCopyInput(),
    },
  };
}

export function buildContactFormCopyInput(): z.input<typeof homeSchema>['contact']['form'] {
  return {
    fields: {
      name: { label: 'Your name', error: 'Name error.' },
      email: { label: 'Your email', error: 'Email error.' },
      message: { label: 'Your message', error: 'Message error.' },
    },
    honeypotLabel: 'Website',
    submitLabel: 'Send',
    pendingLabel: 'Sending now',
    privacyNote: "This site doesn't store it.",
    successMessage: 'Sent, thanks.',
    failureMessage: { beforeEmail: 'Not sent. Write to ', afterEmail: ' instead.' },
  };
}

export function buildExperienceInput(): z.input<typeof experienceSchema> {
  return [
    {
      company: 'Example Corp',
      companyUrl: 'https://example.com',
      context: 'A sample company',
      roles: [{ title: 'Engineer', start: '2024-01' }],
      bullets: ['Built the platform.'],
    },
    {
      company: 'Starter Inc',
      roles: [
        { title: 'Engineer', employmentType: 'Full-time', start: '2022-06', end: '2023-12' },
        { title: 'Intern', employmentType: 'Internship', start: '2022-01', end: '2022-06' },
      ],
      bullets: ['Shipped features.', 'Fixed bugs.'],
    },
  ];
}

export function buildSkillsInput(): z.input<typeof skillsSchema> {
  return {
    core: {
      label: 'Core',
      summary: 'Daily use',
      groups: [{ group: 'Languages', names: ['TypeScript', 'Java'] }],
    },
    comfortable: { label: 'Comfortable', groups: [{ group: 'Testing', names: ['Vitest'] }] },
    past: { label: 'Past', groups: [{ group: 'Other', names: ['C#'] }] },
  };
}

export function buildEducationInput(): z.input<typeof educationSchema> {
  return [
    {
      degree: 'BS Computer Science',
      school: 'Example University',
      city: 'Example City',
      startYear: 2016,
      endYear: 2020,
    },
  ];
}
