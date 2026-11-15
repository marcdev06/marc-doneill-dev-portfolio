import { describe, expect, it } from 'vitest';
import { composeResume, computeResumeContentHash } from '@/lib/content';
import resumeMeta from '../../public/resume.meta.json';
import { education } from './education';
import { experience } from './experience';
import { home } from './home';
import { profile } from './profile';
import { skills } from './skills';

describe('public/resume.pdf', () => {
  it('was generated from the current content', () => {
    const currentHash = computeResumeContentHash(
      composeResume({ profile, experience, skills, education, sectionCopy: home }),
    );

    expect(
      currentHash,
      'Resume content changed since public/resume.pdf was generated. Run `npm run resume:pdf` and commit both files.',
    ).toBe(resumeMeta.contentHash);
  });
});
