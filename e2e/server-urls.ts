import { tmpdir } from 'node:os';
import path from 'node:path';

export const sitePort = 4318;
export const siteUrl = `http://localhost:${String(sitePort)}`;

export const failingDeliveryPort = 4319;
export const failingDeliveryUrl = `http://localhost:${String(failingDeliveryPort)}`;

// Resume requests here expire after 3 seconds
export const shortWindowPort = 4321;
export const shortWindowUrl = `http://localhost:${String(shortWindowPort)}`;

export const fixtureResumePath = 'e2e/fixtures/resume-fixture.pdf';

export function buildEmailLogPath(port: number): string {
  return path.join(tmpdir(), `marc-doneill-dev-portfolio-e2e-emails-${String(port)}.log`);
}
