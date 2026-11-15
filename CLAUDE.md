# CLAUDE.md

Marc's public portfolio site. The repo is itself a code sample, so keep it clean, tested and accessible.

## Project context

The binding context lives in the workspace's `shared-memory/marc-doneill-dev-portfolio/` folder, which sits beside this repo and outside it (milestone briefs give the absolute path). Read it before starting a milestone:

- `project.md`: stack pins, architecture, quality bar, roadmap.
- `content.md` and `design.md`: approved copy and design tokens.
- `features/<milestone>.md`: the brief for the current milestone.

Shared-memory is read-only for repo agents. Report deviations instead of editing it.

## Commands

```bash
npm ci                  # install from the lockfile
npm run dev             # dev server on http://localhost:3000
npm run build           # production build (Turbopack)
npm run start           # serve the production build
npm run typecheck       # next typegen && tsc --noEmit
npm run lint            # eslint . (includes the layer guards and id-length)
npm run format          # prettier --write .
npm run format:check    # prettier --check .
npm run test            # vitest run
npm run test:watch      # vitest in watch mode
npm run coverage        # vitest with coverage thresholds
npm run e2e             # builds, serves on port 4318, runs Playwright + axe
npm run resume:pdf      # builds, renders /resume to public/resume.pdf + resume.meta.json
```

After changing anything the resume shows (profile, experience, skills, education or their headings), run `npm run resume:pdf` and stage both generated files. A Vitest staleness test fails until you do.

Single tests:

```bash
npx vitest run <file> -t "<name>"
npx playwright test <file> --project=desktop
```

Full check before handing work back:

```bash
npm ci && npm run format:check && npm run lint && npm run typecheck && npm run coverage && npm run build && npm run e2e
```

First e2e run on a new machine: `npx playwright install chromium`.

## Folders and layers

- `src/app/`: routes. Keep them thin; they only compose components.
- `src/components/`: shared UI (`ui/`, `sections/`, `mdx/` as they arrive). Server Components by default.
- `src/features/`: self-contained features such as `contact/`.
- `src/lib/`: pure TypeScript (site URL, content schemas and loaders). No React, no Next.
- `src/content/`: site content, validated by schemas in `src/lib/content`.
- `src/styles/`: `_theme.scss` (Bootstrap variable overrides, light and dark), `_tokens.scss` (`--pf-*` custom properties per theme), `_site.scss` (site-wide classes and motion) and `main.scss` (only the Bootstrap partials in use). CSS Modules import `_module-helpers.scss` for Bootstrap variables and mixins.
- `scripts/`: Node scripts run with Node's built-in TypeScript support.
- `test/`: shared test helpers and content fixtures.
- `e2e/`: Playwright specs.

ESLint enforces these rules with `no-restricted-imports`:

- `src/lib/**` must not import `react`, `react-dom`, `next`, `next/*`, `@/components`, `@/features` or `@/app`.
- `src/components/**` must not import `@/features` or `@/app`.
- `src/content/**` (tests excepted) may import only `@/lib/content`.

Client components must import from `@/lib/content` with `import type` only, so zod stays out of the browser bundle.

Coverage thresholds (Vitest): `src/lib/**` 100%, `src/components/**` and `src/features/**` 90%.

## Conventions

- Follow the `coding-style` skill: one-line comments of at most 10 words, or none; descriptive names, never single letters (ESLint `id-length` enforces the last part).
- Style with Bootstrap classes and Sass variables, not compiled-CSS overrides. Never import `bootstrap.bundle.js`; use React-Bootstrap for interactive pieces only.
- Dark-mode Sass variables (`$body-bg-dark` and friends) live in `_theme.scss`: Bootstrap's `_variables.scss` imports `variables-dark` itself.
- Dark is the default theme (`next-themes`, `data-bs-theme` on `<html>`). Motion is CSS-only and switched off under `prefers-reduced-motion`.
- No Tailwind. Every page is statically prerendered; don't enable experimental Next flags.
- `metadataBase` comes from `getSiteUrl()` in `src/lib/site-url.ts`.

## Git workflow

- Create feature branches from `origin/staging`: `git fetch origin`, then `git switch -c feature/<name> origin/staging`.
- Agents stage changes only (`git add`). They never commit, push or open PRs; Marc does that.
- PRs go into `staging`; releases go `staging` → `main` with a merge commit, then a tag.
- On Windows, run git and npm writes through PowerShell when a sandboxed shell can't write `.git`.
