import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useResumeRequestStatus } from './use-resume-request-status';

const { pollingLimit } = vi.hoisted(() => ({ pollingLimit: { ms: 60_000 } }));

vi.mock('@/lib/resume-request/resume-request-timing', () => ({
  statusPollIntervalMs: 5,
  get clientPollingLimitMs() {
    return pollingLimit.ms;
  },
}));

const pendingRequest = { requestId: 'r'.repeat(22), requesterToken: 't'.repeat(43) };

describe('useResumeRequestStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    pollingLimit.ms = 60_000;
  });

  it('stays pending without a request and never polls', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResumeRequestStatus(undefined));

    expect(result.current).toEqual({ status: 'pending' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retries after network errors and unreadable answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(Response.json(null))
        .mockResolvedValueOnce(Response.json({ status: 'surprise' }))
        .mockResolvedValueOnce(Response.json({ status: 'approved', grant: 42 })),
    );

    const { result } = renderHook(() => useResumeRequestStatus(pendingRequest));

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'approved', grant: undefined });
    });
  });

  it('gives up as expired once the client limit passes', async () => {
    pollingLimit.ms = -1;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'pending' })));

    const { result } = renderHook(() => useResumeRequestStatus(pendingRequest));

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'expired' });
    });
  });

  it('stops polling when unmounted', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: 'pending' }));
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = renderHook(() => useResumeRequestStatus(pendingRequest));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    unmount();
    const callsAtUnmount = fetchMock.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(callsAtUnmount + 1);
  });

  it('starts over for a new request', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ status: 'denied' }))
        .mockResolvedValue(Response.json({ status: 'pending' })),
    );
    const { result, rerender } = renderHook(
      ({ trackedRequest }) => useResumeRequestStatus(trackedRequest),
      { initialProps: { trackedRequest: pendingRequest } },
    );
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'denied' });
    });

    rerender({ trackedRequest: { ...pendingRequest, requestId: 's'.repeat(22) } });

    expect(result.current).toEqual({ status: 'pending' });
  });
});
