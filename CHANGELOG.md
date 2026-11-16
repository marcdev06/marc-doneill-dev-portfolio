# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-16

### Added

- Home page sections: a hero with the headline "Building software that makes everyday life easier.", a typewriter role line and availability; an experience timeline; skills in three tiers around an orbit; about; and contact.
- Dark and light themes, dark by default, with no flash on load. Motion is light (CSS animations plus a small typewriter island) and switches off under `prefers-reduced-motion`.
- A gated resume: visitors ask for it in a "Request my resume" dialog, Marc approves or denies each request through an emailed review link, and the dialog waits up to 15 minutes, then downloads `Marc_Doneill_Balatayo_CV.pdf` through a short-lived, three-use link. Requests live in Upstash Redis for 24 hours, with hashed tokens.
- A one-page, two-column resume PDF generated from the site's content (`npm run resume:pdf`) and published to Redis by Marc (`npm run resume:publish`), with a test that fails when it goes stale.
- A contact form: a Server Action with server-side zod validation, Resend delivery, a honeypot and Vercel BotID. Without JavaScript it still posts through the Server Action; on Vercel, BotID will likely treat such posts as bots, so the visitor is pointed to LinkedIn instead.
- Rate limits on resume requests (3 per IP, 2 per email and 20 site-wide per day) and on the contact form (5 per IP per hour), with hashed keys.
- Privacy: no email address or email link anywhere on the site, and no public resume page or PDF.
- SEO: absolute canonical and Open Graph URLs, a generated Open Graph image, `ProfilePage` JSON-LD, `sitemap.xml` and `robots.txt`.
- Cookie-less Vercel Web Analytics, rendered only on Vercel.
- Security headers: `nosniff`, a referrer policy, a permissions policy and a CSP without `script-src`.
- CI on GitHub Actions: formatting, lint, typecheck, unit tests with coverage thresholds, build, Playwright e2e with axe, and Lighthouse CI.

[1.0.0]: https://github.com/marcdev06/marc-doneill-dev-portfolio/releases/tag/v1.0.0
