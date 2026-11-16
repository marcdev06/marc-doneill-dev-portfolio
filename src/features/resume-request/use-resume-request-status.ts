import { useEffect, useState } from 'react';
import {
  buildResumeRequestStatusPath,
  requesterTokenHeaderName,
  type ResumeRequestStatusResponse,
} from '@/lib/resume-request/resume-request-fields';
import {
  clientPollingLimitMs,
  statusPollIntervalMs,
} from '@/lib/resume-request/resume-request-timing';
import type { PendingResumeRequest } from './resume-request-form-state';

export type ResumeRequestProgress =
  | { status: 'pending' }
  | { status: 'approved'; grant?: string }
  | { status: 'denied' | 'expired' | 'failed' };

interface TrackedProgress {
  requestId: string;
  progress: ResumeRequestProgress;
}

const pendingProgress: ResumeRequestProgress = { status: 'pending' };

function readSettledProgress(responseBody: unknown): ResumeRequestProgress | undefined {
  if (typeof responseBody !== 'object' || responseBody === null) {
    return undefined;
  }
  const { status, grant } = responseBody as Partial<ResumeRequestStatusResponse>;
  if (status === 'approved') {
    return { status, grant: typeof grant === 'string' ? grant : undefined };
  }
  if (status === 'denied' || status === 'expired') {
    return { status };
  }
  return undefined;
}

export function useResumeRequestStatus(
  pendingRequest: PendingResumeRequest | undefined,
): ResumeRequestProgress {
  const [trackedProgress, setTrackedProgress] = useState<TrackedProgress>();

  useEffect(() => {
    if (!pendingRequest) {
      return;
    }
    const { requestId, requesterToken } = pendingRequest;
    const pollingStartedAtMs = Date.now();
    let isActive = true;
    let pollTimeout: ReturnType<typeof setTimeout> | undefined;

    const settle = (progress: ResumeRequestProgress) => {
      if (isActive) {
        setTrackedProgress({ requestId, progress });
      }
    };
    const scheduleNextPoll = () => {
      if (isActive) {
        pollTimeout = setTimeout(() => void pollOnce(), statusPollIntervalMs);
      }
    };
    const pollOnce = async () => {
      try {
        const response = await fetch(buildResumeRequestStatusPath(requestId), {
          headers: { [requesterTokenHeaderName]: requesterToken },
          cache: 'no-store',
        });
        if (response.status === 404) {
          settle({ status: 'failed' });
          return;
        }
        const settledProgress = response.ok
          ? readSettledProgress(await response.json())
          : undefined;
        if (settledProgress) {
          settle(settledProgress);
          return;
        }
      } catch {
        // A dropped connection is retried on the next tick
      }
      if (Date.now() - pollingStartedAtMs > clientPollingLimitMs) {
        settle({ status: 'expired' });
        return;
      }
      scheduleNextPoll();
    };

    scheduleNextPoll();
    return () => {
      isActive = false;
      clearTimeout(pollTimeout);
    };
  }, [pendingRequest]);

  return trackedProgress && trackedProgress.requestId === pendingRequest?.requestId
    ? trackedProgress.progress
    : pendingProgress;
}
