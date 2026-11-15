import { describe, expect, it } from 'vitest';
import { listSkillTiers } from '@/lib/content';
import { education } from './education';
import { experience } from './experience';
import { home } from './home';
import { profile } from './profile';
import { site } from './site';
import { skills } from './skills';

describe('site content', () => {
  it('links to Experience, About and Contact, and leaves Projects for M2', () => {
    expect(site.navigationLinks.map((navigationLink) => navigationLink.label)).toEqual([
      'Experience',
      'About',
      'Contact',
    ]);
  });

  it('describes the site for search engines and link previews', () => {
    expect(site.locale).toBe('en_PH');
    expect(site.openGraphImageAlt).toContain(profile.name);
    expect(site.openGraphImageAlt).toContain(
      `${home.hero.headline.beforeHighlight}${home.hero.headline.highlight}`,
    );
    expect(site.resumePage.title).toBe('Resume');
    expect(site.resumePage.description).toContain(profile.name);
  });

  it('uses the approved hero copy', () => {
    expect(home.hero.headline).toEqual({
      beforeHighlight: 'Building software that makes life easier for ',
      highlight: 'every Filipino',
      afterHighlight: '.',
    });
    expect(home.hero.typewriter.phrases).toEqual([
      'full-stack software engineer.',
      'Spring Boot & GraphQL developer.',
      'React & Next.js developer.',
    ]);
    expect(profile.availability.headline).toBe('Open to freelance & contract work');
  });

  it('lists experience newest first, with both Workbean roles', () => {
    expect(experience.map((entry) => entry.company)).toEqual([
      'KwikCare',
      'Singlife Philippines',
      'Workbean',
    ]);
    expect(experience[2]?.roles.map((role) => role.title)).toEqual([
      'Software Engineer',
      'Software Engineer Intern',
    ]);
  });

  it('places each skill in the approved tier and drops C, C++ and PHP', () => {
    const skillNamesByTier = Object.fromEntries(
      listSkillTiers(skills).map((tier) => [
        tier.id,
        tier.groups.flatMap((skillGroup) => skillGroup.names),
      ]),
    );

    expect(skillNamesByTier).toEqual({
      core: [
        'TypeScript',
        'JavaScript',
        'Java',
        'React',
        'Next.js',
        'Tailwind CSS',
        'Bootstrap',
        'Spring Boot',
        'JHipster',
        'GraphQL',
        'Node.js',
        'PostgreSQL',
        'MySQL',
      ],
      comfortable: [
        'Python',
        'Vite',
        'Zustand',
        'Express.js',
        'REST APIs',
        'MongoDB',
        'Amazon DynamoDB',
        'Amazon QLDB',
        'AWS',
        'Vitest',
        'Playwright',
      ],
      past: [
        'C#',
        'Solidity',
        'Dart',
        'Vue',
        'Ionic',
        'Flutter',
        'ASP.NET Core',
        'Flask',
        'Blockchain / Ethereum',
      ],
    });
  });

  it('uses the brief copy for the contact form, with the email from the profile', () => {
    const formCopy = home.contact.form;

    expect(
      [formCopy.fields.name, formCopy.fields.email, formCopy.fields.message].map(
        (fieldCopy) => fieldCopy.label,
      ),
    ).toEqual(['Name', 'Email', 'Message']);
    expect(formCopy.submitLabel).toBe('Send message');
    expect(formCopy.privacyNote).toBe(
      "Your message goes straight to my inbox; this site doesn't store it.",
    );
    expect(formCopy.successMessage).toBe(
      "Thanks, your message was sent. I'll get back to you soon.",
    );
    expect(
      `${formCopy.failureMessage.beforeEmail}${profile.email}${formCopy.failureMessage.afterEmail}`,
    ).toBe(
      "Sorry, your message couldn't be sent. Please email me directly at balatayo.marcdoneill@gmail.com.",
    );
    expect(JSON.stringify(formCopy)).not.toContain(profile.email);
  });

  it('lists only the bachelor degree', () => {
    expect(education).toHaveLength(1);
    expect(education[0]?.degree).toBe('Bachelor of Science in Information Technology');
  });
});
