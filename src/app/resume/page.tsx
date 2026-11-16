import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResumeDocument } from '@/components/resume/resume-document';
import { education } from '@/content/education';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { skills } from '@/content/skills';
import { composeResume, computeResumeContentHash } from '@/lib/content';
import { getConfiguredSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: { absolute: site.resumePage.documentTitle },
  robots: { index: false, follow: false },
};

// Only scripts/generate-resume-pdf.ts sets this, from CONTACT_TO_EMAIL
function readContactEmail(): string | undefined {
  const contactEmail = process.env.RESUME_CONTACT_EMAIL?.trim();
  return contactEmail === '' ? undefined : contactEmail;
}

// Local only, for resume:pdf; Vercel builds serve a 404
export default function ResumePage() {
  if (process.env.VERCEL === '1') {
    notFound();
  }
  const resume = composeResume({
    profile,
    about: site.description,
    experience,
    skills,
    education,
    sectionCopy: home,
    resumeCopy: site.resumePage,
  });

  return (
    <ResumeDocument
      resume={resume}
      contentHash={computeResumeContentHash(resume)}
      fileName={profile.resumeFileName}
      photo={profile.photo}
      siteUrl={getConfiguredSiteUrl()}
      contactEmail={readContactEmail()}
    />
  );
}
