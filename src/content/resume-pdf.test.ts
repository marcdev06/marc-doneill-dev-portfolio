import { describe, expect, it } from 'vitest';
import { composeResume, computeResumeContentHash } from '@/lib/content';
import { education } from './education';
import { experience } from './experience';
import { home } from './home';
import { profile } from './profile';
import resumeMeta from './resume.meta.json';
import { site } from './site';
import { skills } from './skills';

describe('the generated resume PDF', () => {
  it('was generated from the current content', () => {
    const currentHash = computeResumeContentHash(
      composeResume({
        profile,
        about: site.description,
        experience,
        skills,
        education,
        sectionCopy: home,
        resumeCopy: site.resumePage,
      }),
    );

    expect(
      currentHash,
      'Resume content changed since the PDF was generated. Run `npm run resume:pdf` and commit src/content/resume.meta.json.',
    ).toBe(resumeMeta.contentHash);
  });

  it('records the file name the download uses', () => {
    expect(resumeMeta.fileName).toBe(profile.resumeFileName);
  });
});
