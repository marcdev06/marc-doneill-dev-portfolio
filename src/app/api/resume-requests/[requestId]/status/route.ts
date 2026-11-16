import { respondWithResumeRequestStatus } from '@/features/resume-request/resume-request-status-handler';

export async function GET(
  request: Request,
  { params }: RouteContext<'/api/resume-requests/[requestId]/status'>,
) {
  const { requestId } = await params;
  return respondWithResumeRequestStatus(request, requestId);
}
