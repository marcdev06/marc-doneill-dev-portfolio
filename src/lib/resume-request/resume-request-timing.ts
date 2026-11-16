const millisecondsPerMinute = 60 * 1000;

// Marc asked for at least 5 minutes
export const resumeRequestPendingWindowMs = 15 * millisecondsPerMinute;

export const resumeRequestRecordLifetimeMs = 24 * 60 * millisecondsPerMinute;

export const downloadGrantLifetimeMs = 5 * millisecondsPerMinute;

export const downloadGrantMaxUses = 3;

export const statusPollIntervalMs = 5000;

// The server decides expiry; this only stops a stuck client
export const clientPollingLimitMs = resumeRequestPendingWindowMs + 5 * millisecondsPerMinute;
