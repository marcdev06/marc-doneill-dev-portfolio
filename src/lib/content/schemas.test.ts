import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  buildEducationInput,
  buildExperienceInput,
  buildHomeInput,
  buildProfileInput,
  buildSiteInput,
  buildSkillsInput,
} from '../../../test/content-fixtures';
import { educationSchema } from './education-schema';
import { experienceSchema } from './experience-schema';
import { homeSchema } from './home-schema';
import { profileSchema } from './profile-schema';
import { siteSchema } from './site-schema';
import { listSkillTiers, skillsSchema } from './skills-schema';

function listIssues(schema: z.ZodType, content: unknown) {
  const parseResult = schema.safeParse(content);
  return (parseResult.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

describe('siteSchema', () => {
  it('accepts valid site content', () => {
    expect(listIssues(siteSchema, buildSiteInput())).toEqual([]);
  });

  it('requires navigation links to point at home page anchors', () => {
    const siteInput = buildSiteInput();
    siteInput.navigationLinks = [{ label: 'Experience', href: '#experience' }];

    expect(listIssues(siteSchema, siteInput)).toEqual([
      {
        path: 'navigationLinks.0.href',
        message: 'Navigation links point at "/#section" anchors',
      },
    ]);
  });

  it('requires https for external links and at least one navigation link', () => {
    const siteInput = buildSiteInput();
    siteInput.repository.href = 'http://example.com/source';
    siteInput.navigationLinks = [];

    expect(listIssues(siteSchema, siteInput)).toEqual([
      { path: 'repository.href', message: 'Use an absolute https:// URL' },
      { path: 'navigationLinks', message: 'Add at least one navigation link' },
    ]);
  });
});

describe('profileSchema', () => {
  it('accepts a valid profile', () => {
    expect(listIssues(profileSchema, buildProfileInput())).toEqual([]);
  });

  it('explains each invalid field', () => {
    const profileInput = {
      ...buildProfileInput(),
      name: '   ',
      monogram: 'ae',
      email: 'ada-at-example',
      resumePath: '/resume.docx',
      links: { github: 'github.com/ada', linkedin: 'https://www.linkedin.com/in/ada' },
    };

    expect(listIssues(profileSchema, profileInput)).toEqual([
      { path: 'name', message: 'Name is required' },
      { path: 'monogram', message: 'Monogram must be two capital letters' },
      { path: 'email', message: 'Email must be a valid address' },
      { path: 'links.github', message: 'Use an absolute https:// URL' },
      { path: 'resumePath', message: 'Resume path must end in .pdf' },
    ]);
  });
});

describe('homeSchema', () => {
  it('accepts valid home page copy', () => {
    expect(listIssues(homeSchema, buildHomeInput())).toEqual([]);
  });

  it('accepts https, site path and anchor links for actions', () => {
    const homeInput = buildHomeInput();
    homeInput.hero.primaryAction.href = 'https://example.com/contact';
    homeInput.hero.secondaryAction.href = '/resume';

    expect(listIssues(homeSchema, homeInput)).toEqual([]);
  });

  it('rejects unsafe links, empty evidence and missing phrases', () => {
    const homeInput = buildHomeInput();
    homeInput.hero.primaryAction.href = 'javascript:alert(1)';
    homeInput.hero.evidence = [];
    homeInput.hero.typewriter.phrases = [''];

    expect(listIssues(homeSchema, homeInput)).toEqual([
      { path: 'hero.typewriter.phrases.0', message: 'Typewriter phrase is required' },
      { path: 'hero.evidence', message: 'Add at least one text segment' },
      {
        path: 'hero.primaryAction.href',
        message: 'Use an https:// URL, a site path or a "#section" anchor',
      },
    ]);
  });
});

describe('experienceSchema', () => {
  it('accepts companies with one or several roles', () => {
    expect(listIssues(experienceSchema, buildExperienceInput())).toEqual([]);
  });

  it('rejects roles that end before they start and malformed months', () => {
    const experienceInput = buildExperienceInput();
    experienceInput[1] = {
      company: 'Starter Inc',
      roles: [
        { title: 'Engineer', start: '2023-12', end: '2022-06' },
        { title: 'Intern', start: '2022-13' },
      ],
      bullets: ['Shipped features.'],
    };

    expect(listIssues(experienceSchema, experienceInput)).toEqual([
      { path: '1.roles.0.end', message: 'A role cannot end before it starts' },
      { path: '1.roles.1.start', message: 'Use an ISO month such as 2025-09' },
    ]);
  });

  it('keeps entries brief and complete', () => {
    const experienceInput = buildExperienceInput();
    experienceInput[0] = {
      company: 'Example Corp',
      roles: [],
      bullets: ['One.', 'Two.', 'Three.', 'Four.', 'Five.'],
    };

    expect(listIssues(experienceSchema, experienceInput)).toEqual([
      { path: '0.roles', message: 'Add at least one role' },
      { path: '0.bullets', message: 'Keep experience entries to at most 4 bullets' },
    ]);
    expect(listIssues(experienceSchema, [])).toEqual([
      { path: '', message: 'Add at least one company' },
    ]);
  });
});

describe('skillsSchema', () => {
  it('accepts three tiers of grouped skills', () => {
    expect(listIssues(skillsSchema, buildSkillsInput())).toEqual([]);
  });

  it('rejects unknown groups and empty groups', () => {
    const skillsInput = buildSkillsInput();
    skillsInput.past.groups = [{ group: 'Hobbies' as 'Other', names: [] }];

    const issues = listIssues(skillsSchema, skillsInput);

    expect(issues[0]?.path).toBe('past.groups.0.group');
    expect(issues[0]?.message).toMatch(/^Use one of: Languages, Front end/);
    expect(issues[1]).toEqual({
      path: 'past.groups.0.names',
      message: 'A skill group needs at least one skill',
    });
  });

  it('rejects a skill listed in two tiers', () => {
    const skillsInput = buildSkillsInput();
    skillsInput.past.groups = [{ group: 'Languages', names: ['Java'] }];

    expect(listIssues(skillsSchema, skillsInput)).toEqual([
      { path: 'past', message: '"Java" appears in more than one place' },
    ]);
  });

  it('lists the tiers in core, comfortable, past order with their ids', () => {
    const tiers = listSkillTiers(skillsSchema.parse(buildSkillsInput()));

    expect(tiers.map((tier) => [tier.id, tier.label])).toEqual([
      ['core', 'Core'],
      ['comfortable', 'Comfortable'],
      ['past', 'Past'],
    ]);
  });
});

describe('educationSchema', () => {
  it('accepts a degree with its years', () => {
    expect(listIssues(educationSchema, buildEducationInput())).toEqual([]);
  });

  it('rejects an end year before the start year', () => {
    const educationInput = buildEducationInput().map((entry) => ({
      ...entry,
      startYear: 2022,
      endYear: 2018,
    }));

    expect(listIssues(educationSchema, educationInput)).toEqual([
      { path: '0.endYear', message: 'Education cannot end before it starts' },
    ]);
  });
});
