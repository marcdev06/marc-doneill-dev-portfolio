import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

const layerMessage = 'Layer rule: see CLAUDE.md → Folders and layers.';

const libRestrictedImports = {
  paths: ['react', 'react-dom', 'next'].map((packageName) => ({
    name: packageName,
    message: `${layerMessage} src/lib is pure TypeScript.`,
  })),
  patterns: [
    {
      group: ['react/*', 'react-dom/*', 'next/*'],
      message: `${layerMessage} src/lib is pure TypeScript.`,
    },
    {
      regex: '^(@/|(\\.\\./)+)(components|features|app)(/|$)',
      message: `${layerMessage} src/lib must not depend on UI or route layers.`,
    },
  ],
};

const componentsRestrictedImports = {
  patterns: [
    {
      regex: '^(@/|(\\.\\./)+)(features|app)(/|$)',
      message: `${layerMessage} src/components must not depend on features or routes.`,
    },
  ],
};

const contentRestrictedImports = {
  patterns: [
    {
      regex: '^(?!@/lib/content$)',
      message: `${layerMessage} src/content may import only @/lib/content.`,
    },
  ],
};

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'id-length': ['error', { min: 2, exceptions: ['_'] }],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', libRestrictedImports],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', componentsRestrictedImports],
    },
  },
  {
    files: ['src/content/**/*.{ts,tsx}'],
    ignores: ['src/content/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', contentRestrictedImports],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.claude/**',
    'next-env.d.ts',
  ]),
]);
