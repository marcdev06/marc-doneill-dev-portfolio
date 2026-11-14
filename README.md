# marc-doneill-dev-portfolio

Marc Doneill Balatayo's portfolio site. It is statically prerendered and deployed on Vercel.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict)
- Bootstrap 5.3 (Sass) and React-Bootstrap
- ESLint 9, Prettier, Vitest with React Testing Library, Playwright with axe
- GitHub Actions CI

## Getting started

Requires Node 24 (see `.nvmrc`).

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` to set `NEXT_PUBLIC_SITE_URL`.

Before the first e2e run, install the browser with `npx playwright install chromium`.

## Scripts

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Start the dev server                                  |
| `npm run build`        | Production build                                      |
| `npm run start`        | Serve the production build                            |
| `npm run typecheck`    | Generate route types, then run `tsc --noEmit`         |
| `npm run lint`         | ESLint, including the layer guards                    |
| `npm run format`       | Format with Prettier                                  |
| `npm run format:check` | Check formatting                                      |
| `npm run test`         | Unit and component tests (Vitest)                     |
| `npm run test:watch`   | Vitest in watch mode                                  |
| `npm run coverage`     | Tests with coverage thresholds                        |
| `npm run e2e`          | Build, serve on port 4318 and run Playwright with axe |
