import type { Metadata } from 'next';
import { ResumeDocument } from '@/components/resume/resume-document';
import { education } from '@/content/education';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { skills } from '@/content/skills';
import { composeResume, computeResumeContentHash } from '@/lib/content';
import { getConfiguredSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Resume',
};

export default function ResumePage() {
  const resume = composeResume({ profile, experience, skills, education, sectionCopy: home });

  return (
    <ResumeDocument
      resume={resume}
      contentHash={computeResumeContentHash(resume)}
      siteUrl={getConfiguredSiteUrl()}
      pdfPath={profile.resumePath}
      downloadLabel={home.contact.resumeLabel}
    />
  );
}
