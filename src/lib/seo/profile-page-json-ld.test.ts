import { describe, expect, it } from 'vitest';
import {
  buildEducationInput,
  buildExperienceInput,
  buildProfileInput,
  buildSkillsInput,
} from '../../../test/content-fixtures';
import { educationSchema, experienceSchema, profileSchema, skillsSchema } from '../content';
import { buildProfilePageJsonLd, serializeJsonLd } from './profile-page-json-ld';

const siteUrl = new URL('https://ada.example.com');

function buildSources() {
  return {
    profile: profileSchema.parse(buildProfileInput()),
    description: 'Builds dependable web apps.',
    experience: experienceSchema.parse(buildExperienceInput()),
    education: educationSchema.parse(buildEducationInput()),
    skills: skillsSchema.parse(buildSkillsInput()),
    siteUrl,
  };
}

describe('buildProfilePageJsonLd', () => {
  it('describes the person behind the profile page from content', () => {
    expect(buildProfilePageJsonLd(buildSources())).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: 'https://ada.example.com/',
      mainEntity: {
        '@type': 'Person',
        name: 'Ada Example',
        jobTitle: 'Software Engineer',
        description: 'Builds dependable web apps.',
        url: 'https://ada.example.com/',
        image: 'https://ada.example.com/images/ada.jpg',
        sameAs: ['https://www.linkedin.com/in/ada', 'https://github.com/ada'],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Example City',
          addressCountry: 'GB',
        },
        worksFor: { '@type': 'Organization', name: 'Example Corp', url: 'https://example.com' },
        alumniOf: [{ '@type': 'EducationalOrganization', name: 'Example University' }],
        knowsAbout: ['TypeScript', 'Java'],
      },
    });
  });

  it('never exposes the email address or a phone number', () => {
    const serializedJsonLd = JSON.stringify(buildProfilePageJsonLd(buildSources()));

    expect(serializedJsonLd).not.toContain('ada@example.com');
    expect(serializedJsonLd).not.toMatch(/email|telephone|streetAddress/);
  });

  it('leaves out the employer when every role has ended', () => {
    const sources = buildSources();
    sources.experience = sources.experience.slice(1);

    expect(buildProfilePageJsonLd(sources).mainEntity).not.toHaveProperty('worksFor');
  });

  it('names a current employer that has no website', () => {
    const sources = buildSources();
    sources.experience = experienceSchema.parse([
      { company: 'Starter Inc', roles: [{ title: 'Lead', start: '2024-01' }], bullets: ['Leads.'] },
    ]);

    expect(buildProfilePageJsonLd(sources).mainEntity).toMatchObject({
      worksFor: { '@type': 'Organization', name: 'Starter Inc' },
    });
    expect(buildProfilePageJsonLd(sources).mainEntity).not.toHaveProperty('worksFor.url');
  });
});

describe('serializeJsonLd', () => {
  it('escapes "<" so content cannot close the script element', () => {
    const serializedJsonLd = serializeJsonLd({ name: '</script><script>alert(1)</script>' });

    expect(serializedJsonLd).not.toContain('<');
    expect(serializedJsonLd).toBe(
      '{"name":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}',
    );
    expect(JSON.parse(serializedJsonLd)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
