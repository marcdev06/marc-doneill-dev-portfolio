import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { installMatchMedia } from './test/match-media';

beforeEach(() => {
  installMatchMedia();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-bs-theme');
  document.documentElement.removeAttribute('style');
});
