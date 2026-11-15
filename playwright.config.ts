import { defineConfig, devices } from '@playwright/test';
import { failingDeliveryPort, failingDeliveryUrl, sitePort, siteUrl } from './e2e/server-urls';

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0,
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
      env: { CONTACT_DELIVERY: 'log' },
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
  ],
});
