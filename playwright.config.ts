import { defineConfig, devices } from '@playwright/test';
import {
  buildEmailLogPath,
  failingDeliveryPort,
  failingDeliveryUrl,
  fixtureResumePath,
  shortWindowPort,
  shortWindowUrl,
  sitePort,
  siteUrl,
} from './e2e/server-urls';

const isCi = Boolean(process.env.CI);

// Test-only: memory store, logged emails and a fixture PDF
function buildResumeRequestEnvironment(port: number) {
  return {
    CONTACT_DELIVERY: 'log',
    CONTACT_LOG_FILE: buildEmailLogPath(port),
    RESUME_REQUEST_STORE: 'memory',
    RESUME_REQUEST_FIXTURE_PDF: fixtureResumePath,
    RESUME_REQUEST_SITE_DAILY_LIMIT: '1000',
  };
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0,
  // Cold Server Actions on CI runners are slow
  expect: { timeout: isCi ? 15_000 : 5_000 },
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: siteUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: `npx next build && npx next start --port ${String(sitePort)}`,
      // Never email from tests; the action logs messages instead
      env: buildResumeRequestEnvironment(sitePort),
      url: siteUrl,
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      // Starts after the build above; unknown modes fail every send
      command: `npx next start --port ${String(failingDeliveryPort)}`,
      env: { CONTACT_DELIVERY: 'disabled' },
      url: failingDeliveryUrl,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx next start --port ${String(shortWindowPort)}`,
      env: {
        ...buildResumeRequestEnvironment(shortWindowPort),
        RESUME_REQUEST_PENDING_WINDOW_SECONDS: '3',
      },
      url: shortWindowUrl,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
