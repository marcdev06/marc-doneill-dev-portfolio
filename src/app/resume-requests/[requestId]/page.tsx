import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/content/site';
import { loadResumeRequestReview } from '@/features/resume-request/load-resume-request-review';
import { ResumeRequestReview } from '@/features/resume-request/resume-request-review';

export const metadata: Metadata = {
  title: site.resumeReview.title,
  robots: { index: false, follow: false },
};

export default async function ResumeRequestReviewPage({
  params,
  searchParams,
}: PageProps<'/resume-requests/[requestId]'>) {
  const [{ requestId }, { token }] = await Promise.all([params, searchParams]);
  const approvalToken = typeof token === 'string' ? token : undefined;
  const view = await loadResumeRequestReview(requestId, approvalToken);
  if (!view || !approvalToken) {
    notFound();
  }

  return <ResumeRequestReview view={view} approvalToken={approvalToken} copy={site.resumeReview} />;
}
