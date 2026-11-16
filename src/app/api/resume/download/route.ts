import { education } from '@/content/education';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { skills } from '@/content/skills';
import { respondWithResumeDownload } from '@/features/resume-request/resume-download-handler';
import { composeResume, computeResumeContentHash } from '@/lib/content';

const currentContentHash = computeResumeContentHash(
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

export function GET(request: Request) {
  return respondWithResumeDownload(request, {
    fileName: profile.resumeFileName,
    currentContentHash,
  });
}
