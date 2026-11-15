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
npm run e2e             # builds, serves on 4318 (log), 4319 (delivery off) and 4321 (3 s resume window), runs Playwright + axe
npm run lighthouse      # Lighthouse CI on 4320 (/ only, mobile, median of 3); needs a prior build
npm run resume:pdf      # builds, renders /resume to .resume/Marc_Doneill_Balatayo_CV.pdf + src/content/resume.meta.json
npm run resume:publish  # Marc only: uploads the generated PDF to Redis with his .env.local credentials
```

Lighthouse CI asserts at least 0.95 in all four categories and writes reports to the git-ignored `.lighthouseci/`. It needs a local Chrome.

After changing anything the resume shows (profile, experience, skills, education, `site.description` or the headings), run `npm run resume:pdf` and stage `src/content/resume.meta.json`. A Vitest staleness test fails until you do. The PDF itself goes to the git-ignored `.resume/` and is never committed. Marc then runs `npm run resume:publish`; agents never handle Redis credentials.

Single tests:

```bash
npx vitest run <file> -t "<name>"
npx playwright test <file> --project=desktop
```

Full check before handing work back:

```bash
npm ci && npm run format:check && npm run lint && npm run typecheck && npm run coverage && npm run build && npm run e2e && npm run lighthouse
```

First e2e run on a new machine: `npx playwright install chromium`.

## Folders and layers

- `src/app/`: routes. Keep them thin; they only compose components.
- `src/components/`: shared UI (`ui/`, `sections/`, `mdx/` as they arrive). Server Components by default.
- `src/features/`: self-contained features: `contact/`, `resume-request/` (dialog, Server Actions, Route Handler logic, review page), `request-store/` (Redis adapter, Upstash rate limiter), `email/` (Resend and log senders) and `bot-protection/`.
- `src/lib/`: pure TypeScript (site URL, content schemas and loaders, SEO builders in `seo/`, the key-value store interface and memory store in `request-store/`, the resume request state machine in `resume-request/`). No React, no Next.
- `src/content/`: site content, validated by schemas in `src/lib/content`.
- `src/styles/`: `_theme.scss` (Bootstrap variable overrides, light and dark), `_tokens.scss` (`--pf-*` custom properties per theme), `_site.scss` (site-wide classes and motion) and `main.scss` (only the Bootstrap partials in use). CSS Modules import `_module-helpers.scss` for Bootstrap variables and mixins.
- `assets/`: build-time files that are not served, such as the Poppins TTFs (with `OFL.txt`) for the Open Graph image.
- `docs/`: the README screenshot.
- `scripts/`: Node scripts run with Node's built-in TypeScript support.
- `test/`: shared test helpers and content fixtures.
- `e2e/`: Playwright specs.

ESLint enforces these rules with `no-restricted-imports`:

- `src/lib/**` must not import `react`, `react-dom`, `next`, `next/*`, `@/components`, `@/features` or `@/app`.
- `src/components/**` must not import `@/features` or `@/app`.
- `src/content/**` (tests excepted) may import only `@/lib/content`.

Client components must import from `@/lib/content` with `import type` only, so zod stays out of the browser bundle. From `src/lib/contact`, client code may import only `contact-fields.ts`, and from `src/lib/resume-request` only `resume-request-fields.ts` and `resume-request-timing.ts`; zod, token hashing and `@upstash/*` stay on the server.

Coverage thresholds (Vitest): `src/lib/**` 100%, `src/components/**` and `src/features/**` 90%.

## Conventions

- Follow the `coding-style` skill: one-line comments of at most 10 words, or none; descriptive names, never single letters (ESLint `id-length` enforces the last part).
- Style with Bootstrap classes and Sass variables, not compiled-CSS overrides. Never import `bootstrap.bundle.js`; use React-Bootstrap for interactive pieces only.
- Dark-mode Sass variables (`$body-bg-dark` and friends) live in `_theme.scss`: Bootstrap's `_variables.scss` imports `variables-dark` itself.
- Dark is the default theme (`next-themes`, `data-bs-theme` on `<html>`). Motion is CSS plus a small typewriter island, all switched off under `prefers-reduced-motion`.
- No Tailwind. Every page is statically prerendered except the resume review page and the two resume Route Handlers; don't enable experimental Next flags.
- `metadataBase` comes from `getSiteUrl()` in `src/lib/site-url.ts`. Every URL in `<head>` must be absolute; e2e checks it.
- SEO files: `src/app/opengraph-image.tsx` (static, reads fonts and the photo with `fs`), `robots.ts`, `sitemap.ts` and the JSON-LD in `page.tsx`. Their logic lives in `src/lib/seo/` (100% covered). SEO copy lives in `src/content/site.ts`. A page that sets `openGraph` must use `buildOpenGraph()`, or it loses the shared image. New indexable routes go in `indexedPagePaths`; today that's `/` only.
- `/resume` is local only: it renders the PDF and renders a static 404 when `VERCEL=1` at build time. It's `noindex` and never in the sitemap or Lighthouse.
- `robots.txt` disallows crawling only when `VERCEL_ENV` is set and isn't `production`, so Lighthouse's crawlability audit passes locally and in CI.
- Analytics: `<VercelAnalytics />` renders `@vercel/analytics` only when `NEXT_PUBLIC_VERCEL_ENV` is set, so local, CI and Lighthouse runs never request `/_vercel/insights/*`. No Speed Insights and no custom events.
- Security headers live in `next.config.ts`. Don't add `script-src`: nonces would make pages dynamic.
- Bundle budget for `/`: at most 160 kB gzip JS and 25 kB gzip CSS, measured on a build with `NEXT_PUBLIC_VERCEL_ENV=preview`. BotID's client and the resume request dialog are lazy-loaded to stay inside it.
- Contact form: never send real email from local runs, tests or CI. Use `CONTACT_DELIVERY=log` (Playwright's `webServer` sets it) and mock `resend` in unit tests. BotID verifies only on Vercel (`VERCEL=1` on the server, `NEXT_PUBLIC_VERCEL_ENV` on the client); elsewhere it answers human. Its client starts from `useLazyBotProtection` when the form nears the viewport or gets focus, or when the resume dialog opens; a submit before that fails closed.
- **Marc's email address never goes in the repo**: not in content, code, tests, fixtures, docs or `public/`, and no email links. It lives only in `CONTACT_TO_EMAIL` (server env and `.env.local`) and inside the gated PDF. Fixtures use `@example.com`.
- Resume requests need Upstash Redis (`KV_REST_API_URL`/`KV_REST_API_TOKEN`). `RESUME_REQUEST_STORE=memory` is for unit tests and e2e only and fails closed on Vercel; so do the memory-only overrides (`RESUME_REQUEST_PENDING_WINDOW_SECONDS`, `RESUME_REQUEST_SITE_DAILY_LIMIT`, `RESUME_REQUEST_FIXTURE_PDF`) and the `CONTACT_LOG_FILE` e2e seam. Store only hashes of tokens, and hash IPs and emails before they become rate-limit keys.
- The review page and Route Handlers send `no-store` and `noindex`. Review links are GET-only displays; decisions are POSTed Server Actions, because mail scanners prefetch links.

## Git workflow

- Create feature branches from `origin/staging`: `git fetch origin`, then `git switch -c feature/<name> origin/staging`.
- Agents stage changes only (`git add`). They never commit, push or open PRs; Marc does that.
- PRs go into `staging`; releases go `staging` → `main` with a merge commit, then a tag.
- On Windows, run git and npm writes through PowerShell when a sandboxed shell can't write `.git`.
