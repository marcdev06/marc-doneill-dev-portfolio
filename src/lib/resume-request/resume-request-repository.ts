import type { KeyValueStore } from '../request-store/key-value-store';
import { buildResumeRequestKeys } from '../request-store/store-keys';
import type { ResumeRequestStatus } from './resume-request-fields';
import {
  downloadGrantLifetimeMs,
  downloadGrantMaxUses,
  resumeRequestRecordLifetimeMs,
} from './resume-request-timing';
import {
  doesTokenMatchHash,
  generateRequestId,
  generateSecretToken,
  hashSecretToken,
  isWellFormedRequestId,
  isWellFormedSecretToken,
} from './resume-request-tokens';

export interface ResumeRequestDetails {
  name: string;
  email: string;
  note?: string;
  country?: string;
}

export interface ResumeRequestRecord extends ResumeRequestDetails {
  id: string;
  requesterTokenHash: string;
  approvalTokenHash: string;
  createdAtMs: number;
  decideByMs: number;
}

export type ResumeRequestDecision = 'approved' | 'denied';

interface StoredDecision {
  decision: ResumeRequestDecision;
  decidedAtMs: number;
}

interface StoredGrantWindow {
  endsAtMs: number;
}

interface StoredGrant {
  requestId: string;
}

export interface ResumeRequestView {
  record: ResumeRequestRecord;
  status: ResumeRequestStatus;
  decidedAtMs?: number;
}

export type DecisionOutcome = 'decided' | 'already-decided' | 'expired' | 'not-found';

type TokenHashField = 'requesterTokenHash' | 'approvalTokenHash';

export function createResumeRequestRepository(
  store: KeyValueStore,
  environmentPrefix: string,
  readNowMs: () => number = Date.now,
) {
  const keys = buildResumeRequestKeys(environmentPrefix);

  function remainingLifetimeMs(record: ResumeRequestRecord): number {
    return Math.max(record.createdAtMs + resumeRequestRecordLifetimeMs - readNowMs(), 1);
  }

  async function findAuthorized(
    requestId: string,
    secretToken: string | undefined,
    tokenHashField: TokenHashField,
  ): Promise<ResumeRequestView | undefined> {
    if (
      !secretToken ||
      !isWellFormedRequestId(requestId) ||
      !isWellFormedSecretToken(secretToken)
    ) {
      return undefined;
    }
    const record = await store.readJson<ResumeRequestRecord>(keys.request(requestId));
    if (!record || !doesTokenMatchHash(secretToken, record[tokenHashField])) {
      return undefined;
    }
    const storedDecision = await store.readJson<StoredDecision>(keys.decision(requestId));
    if (storedDecision) {
      return { record, status: storedDecision.decision, decidedAtMs: storedDecision.decidedAtMs };
    }
    return { record, status: readNowMs() < record.decideByMs ? 'pending' : 'expired' };
  }

  return {
    async create(details: ResumeRequestDetails, pendingWindowMs: number) {
      const requesterToken = generateSecretToken();
      const approvalToken = generateSecretToken();
      const createdAtMs = readNowMs();
      const record: ResumeRequestRecord = {
        ...details,
        id: generateRequestId(),
        requesterTokenHash: hashSecretToken(requesterToken),
        approvalTokenHash: hashSecretToken(approvalToken),
        createdAtMs,
        decideByMs: createdAtMs + pendingWindowMs,
      };
      await store.writeJson(keys.request(record.id), record, {
        expiresInMs: resumeRequestRecordLifetimeMs,
      });
      return { record, requesterToken, approvalToken };
    },

    findForRequester(requestId: string, requesterToken: string | undefined) {
      return findAuthorized(requestId, requesterToken, 'requesterTokenHash');
    },

    findForReviewer(requestId: string, approvalToken: string | undefined) {
      return findAuthorized(requestId, approvalToken, 'approvalTokenHash');
    },

    async decide(
      requestId: string,
      approvalToken: string | undefined,
      decision: ResumeRequestDecision,
    ): Promise<DecisionOutcome> {
      const view = await findAuthorized(requestId, approvalToken, 'approvalTokenHash');
      if (!view) {
        return 'not-found';
      }
      if (view.status !== 'pending') {
        return view.status === 'expired' ? 'expired' : 'already-decided';
      }
      const storedDecision: StoredDecision = { decision, decidedAtMs: readNowMs() };
      const isFirstDecision = await store.writeJson(keys.decision(requestId), storedDecision, {
        expiresInMs: remainingLifetimeMs(view.record),
        onlyIfAbsent: true,
      });
      return isFirstDecision ? 'decided' : 'already-decided';
    },

    // Reissues share one window and one use budget
    async issueDownloadGrant(view: ResumeRequestView): Promise<string | undefined> {
      if (view.status !== 'approved') {
        return undefined;
      }
      const requestId = view.record.id;
      const firstWindow: StoredGrantWindow = { endsAtMs: readNowMs() + downloadGrantLifetimeMs };
      const isFirstGrant = await store.writeJson(keys.grantWindow(requestId), firstWindow, {
        expiresInMs: remainingLifetimeMs(view.record),
        onlyIfAbsent: true,
      });
      const grantWindow = isFirstGrant
        ? firstWindow
        : await store.readJson<StoredGrantWindow>(keys.grantWindow(requestId));
      const grantLifetimeMs = grantWindow ? grantWindow.endsAtMs - readNowMs() : 0;
      if (grantLifetimeMs <= 0) {
        return undefined;
      }
      const grantToken = generateSecretToken();
      const storedGrant: StoredGrant = { requestId };
      await store.writeJson(keys.grant(hashSecretToken(grantToken)), storedGrant, {
        expiresInMs: grantLifetimeMs,
      });
      return grantToken;
    },

    async findGrantedRequestId(grantToken: string | null): Promise<string | undefined> {
      if (!grantToken || !isWellFormedSecretToken(grantToken)) {
        return undefined;
      }
      const storedGrant = await store.readJson<StoredGrant>(
        keys.grant(hashSecretToken(grantToken)),
      );
      return storedGrant?.requestId;
    },

    async consumeDownload(requestId: string): Promise<boolean> {
      const downloadCount = await store.increment(
        keys.downloads(requestId),
        resumeRequestRecordLifetimeMs,
      );
      return downloadCount <= downloadGrantMaxUses;
    },
  };
}

export type ResumeRequestRepository = ReturnType<typeof createResumeRequestRepository>;
