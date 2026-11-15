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
    expect(site.openGraphImageAlt).toBe(
      'Marc Doneill Balatayo, Full-Stack Software Engineer: Building software that makes everyday life easier.',
    );
    expect(site.openGraphImageAlt).toContain(
      `${home.hero.headline.beforeHighlight}${home.hero.headline.highlight}${home.hero.headline.afterHighlight}`,
    );
  });

  it('titles the skills section Technical Skills, on the site and in the resume', () => {
    expect(home.skills.heading).toBe('Technical Skills');
  });

  it('titles the resume PDF and names its file', () => {
    expect(site.resumePage.documentTitle).toBe('Marc Doneill Balatayo – CV');
    expect(profile.resumeFileName).toBe('Marc_Doneill_Balatayo_CV.pdf');
  });

  it('uses the approved hero copy', () => {
    expect(home.hero.headline).toEqual({
      beforeHighlight: 'Building software that makes ',
      highlight: 'everyday life',
      afterHighlight: ' easier.',
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

  it("uses Marc's company subheadings, without trailing periods", () => {
    expect(experience.map((entry) => entry.context)).toEqual([
      'A digital insurance brokerage and subscription-based HMO (Health Maintenance Organization) provider in the Philippines',
      'A mobile-first, digital life insurance and financial services company in the Philippines',
      'An employer branding company',
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

  it('uses the brief copy for the contact form, pointing failures at LinkedIn', () => {
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
    const { beforeLink, linkLabel, afterLink } = formCopy.failureMessage;
    expect(`${beforeLink}${linkLabel}${afterLink}`).toBe(
      "Sorry, your message couldn't be sent. Please try again in a few minutes, or message me on LinkedIn.",
    );
  });

  it('uses the brief copy for the resume request dialog', () => {
    const requestCopy = home.contact.resumeRequest;

    expect(requestCopy.triggerLabel).toBe('Request my resume');
    expect(requestCopy.title).toBe('Request my resume');
    expect(requestCopy.intro).toBe(
      "Share your name and email and I'll approve your request personally, usually within a few minutes. Keep this window open: the download starts as soon as I approve.",
    );
    expect(requestCopy.privacyNote).toBe(
      'Your name and email go only to me and are deleted automatically after 24 hours.',
    );
    expect([requestCopy.submitLabel, requestCopy.pendingLabel]).toEqual([
      'Send request',
      'Sending…',
    ]);
    expect(requestCopy.waitingMessage).toBe(
      'Request sent. Waiting for my approval; this usually takes a few minutes.',
    );
    expect([requestCopy.approvedMessage, requestCopy.downloadLabel]).toEqual([
      'Approved. Your download is starting.',
      'Download the PDF',
    ]);
    expect(requestCopy.deniedMessage).toBe(
      "Sorry, I can't share my resume for this request. You can still reach me through the contact form.",
    );
    expect(requestCopy.expiredMessage).toBe(
      "I haven't been able to approve this yet. I have your details and will reply by email.",
    );
    expect(requestCopy.rateLimitedMessage).toBe(
      "You've reached the request limit. Please try again tomorrow, or use the contact form.",
    );
    expect(requestCopy.failureMessage).toBe(
      "Sorry, the request couldn't be sent. Please try again later, or use the contact form.",
    );
  });

  it('keeps every email address out of the published content', () => {
    const publishedContent = JSON.stringify({ site, profile, home, experience, education, skills });

    const emailAddresses = publishedContent.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];

    expect(emailAddresses).toEqual(['name@example.com', 'name@example.com']);
    expect(publishedContent).not.toContain('mailto');
  });

  it('lists only the bachelor degree', () => {
    expect(education).toHaveLength(1);
    expect(education[0]?.degree).toBe('Bachelor of Science in Information Technology');
  });
});
