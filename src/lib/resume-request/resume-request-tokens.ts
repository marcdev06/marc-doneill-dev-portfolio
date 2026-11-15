import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const requestIdBytes = 16;
const secretTokenBytes = 32;
const requestIdPattern = /^[\w-]{22}$/;
const secretTokenPattern = /^[\w-]{43}$/;

export function generateRequestId(): string {
  return randomBytes(requestIdBytes).toString('base64url');
}

export function generateSecretToken(): string {
  return randomBytes(secretTokenBytes).toString('base64url');
}

export function hashSecretToken(secretToken: string): string {
  return createHash('sha256').update(secretToken).digest('base64url');
}

export function isWellFormedRequestId(requestId: string): boolean {
  return requestIdPattern.test(requestId);
}

export function isWellFormedSecretToken(secretToken: string): boolean {
  return secretTokenPattern.test(secretToken);
}

export function doesTokenMatchHash(candidateToken: string, storedHash: string): boolean {
  const candidateHash = Buffer.from(hashSecretToken(candidateToken));
  const expectedHash = Buffer.from(storedHash);
  return (
    candidateHash.length === expectedHash.length && timingSafeEqual(candidateHash, expectedHash)
  );
}
