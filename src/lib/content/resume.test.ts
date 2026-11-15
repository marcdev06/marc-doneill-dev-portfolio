import { describe, expect, it } from 'vitest';
import {
  buildEducationInput,
  buildExperienceInput,
  buildHomeInput,
  buildProfileInput,
  buildSkillsInput,
} from '../../../test/content-fixtures';
import { computeContentHash } from './content-hash';
import { educationSchema } from './education-schema';
import { experienceSchema } from './experience-schema';
import { homeSchema } from './home-schema';
import { profileSchema } from './profile-schema';
import { composeResume, computeResumeContentHash, formatDisplayUrl } from './resume';
import { skillsSchema } from './skills-schema';

function buildResumeSources() {
  return {
    profile: profileSchema.parse(buildProfileInput()),
    experience: experienceSchema.parse(buildExperienceInput()),
    skills: skillsSchema.parse(buildSkillsInput()),
    education: educationSchema.parse(buildEducationInput()),
    sectionCopy: homeSchema.parse(buildHomeInput()),
  };
}

describe('composeResume', () => {
  it('keeps only what the resume shows, with no phone or street address', () => {
    const resume = composeResume(buildResumeSources());

    expect(Object.keys(resume).sort()).toEqual([
      'education',
      'email',
      'experience',
      'headings',
      'links',
      'location',
      'name',
      'skills',
      'title',
    ]);
    expect(resume.links).toEqual({
      github: 'https://github.com/ada',
      linkedin: 'https://www.linkedin.com/in/ada',
    });
    expect(resume.headings).toEqual({
      experience: 'Experience',
      skills: 'Skills',
      education: 'Education',
    });
  });
});

describe('computeResumeContentHash', () => {
  it('hashes the composed resume', () => {
    const resume = composeResume(buildResumeSources());

    expect(computeResumeContentHash(resume)).toBe(computeContentHash(resume));
  });

  it('ignores profile fields the resume does not show', () => {
    const resumeSources = buildResumeSources();
    const originalHash = computeResumeContentHash(composeResume(resumeSources));
    resumeSources.profile.photo.alt = 'A different alt text';

    expect(computeResumeContentHash(composeResume(resumeSources))).toBe(originalHash);
  });

  it('changes when an experience bullet changes', () => {
    const resumeSources = buildResumeSources();
    const originalHash = computeResumeContentHash(composeResume(resumeSources));
    resumeSources.experience[0]?.bullets.push('Mentored two interns.');

    expect(computeResumeContentHash(composeResume(resumeSources))).not.toBe(originalHash);
  });
});

describe('formatDisplayUrl', () => {
  it.each([
    ['https://www.linkedin.com/in/marcdev06', 'linkedin.com/in/marcdev06'],
    ['https://github.com/marcdev06/', 'github.com/marcdev06'],
    ['http://localhost:3000/', 'localhost:3000'],
  ])('shortens %s to %s', (url, expectedLabel) => {
    expect(formatDisplayUrl(url)).toBe(expectedLabel);
  });
});
