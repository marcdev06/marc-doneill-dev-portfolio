import type { Metadata } from 'next';
import { ResumeDocument } from '@/components/resume/resume-document';
import { education } from '@/content/education';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { skills } from '@/content/skills';
import { composeResume, computeResumeContentHash } from '@/lib/content';
import { buildOpenGraph } from '@/lib/seo';
import { getConfiguredSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: site.resumePage.title,
  description: site.resumePage.description,
  alternates: { canonical: '/resume' },
  openGraph: buildOpenGraph(site, {
    path: '/resume',
    title: `${site.resumePage.title} · ${site.name}`,
    description: site.resumePage.description,
  }),
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
