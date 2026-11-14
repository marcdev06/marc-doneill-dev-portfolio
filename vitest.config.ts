import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const fullCoverage = { statements: 100, branches: 100, functions: 100, lines: 100 };
const componentCoverage = { statements: 90, branches: 90, functions: 90, lines: 90 };

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        'src/lib/**': fullCoverage,
        'src/components/**': componentCoverage,
        'src/features/**': componentCoverage,
      },
    },
  },
});
