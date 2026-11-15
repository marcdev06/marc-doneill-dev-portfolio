# marc-doneill-dev-portfolio

Marc Doneill Balatayo's portfolio site. It is statically prerendered and deployed on Vercel.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict)
- Bootstrap 5.3 (Sass) and React-Bootstrap, Poppins, `next-themes` (dark by default)
- Content in typed modules validated with zod; icons from Simple Icons and Bootstrap Icons
- ESLint 9, Prettier, Vitest with React Testing Library, Playwright with axe
- GitHub Actions CI

The resume PDF (`public/resume.pdf`) is generated from the same content as the site by `npm run resume:pdf`, and a unit test fails if the content changes without regenerating it.

The contact form is a Server Action. It validates with zod on the server and emails through [Resend](https://resend.com). Spam protection is a honeypot field plus [Vercel BotID](https://vercel.com/docs/botid). The site doesn't store messages; Resend keeps its own sending logs.

## Getting started

Requires Node 24 (see `.nvmrc`).

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` to set `NEXT_PUBLIC_SITE_URL` and the contact form variables.

`CONTACT_DELIVERY=log` (the example's value) prints contact messages to the server console instead of emailing them. To send real email, set `CONTACT_DELIVERY=resend`, `RESEND_API_KEY` and `CONTACT_TO_EMAIL`. Tests and e2e never send email: e2e runs one server in log mode and a second with delivery disabled, which exercises the failure message. BotID only verifies visitors on Vercel; locally and in tests it treats every visitor as human.

Before the first e2e run, install the browser with `npx playwright install chromium`.

## Scripts

| Script                 | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Start the dev server                                            |
| `npm run build`        | Production build                                                |
| `npm run start`        | Serve the production build                                      |
| `npm run typecheck`    | Generate route types, then run `tsc --noEmit`                   |
| `npm run lint`         | ESLint, including the layer guards                              |
| `npm run format`       | Format with Prettier                                            |
| `npm run format:check` | Check formatting                                                |
| `npm run test`         | Unit and component tests (Vitest)                               |
| `npm run test:watch`   | Vitest in watch mode                                            |
| `npm run coverage`     | Tests with coverage thresholds                                  |
| `npm run e2e`          | Build, serve on ports 4318 and 4319 and run Playwright with axe |
| `npm run resume:pdf`   | Build, then render `/resume` to `public/resume.pdf`             |

## Credits

- Design inspired by [Motionfolio](https://www.figma.com/community/file/1690280357896220844/motionfolio-modern-portfolio-landing-page) by Saba Rezaeian ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
- Technology logos from [Simple Icons](https://simpleicons.org/) (CC0); interface icons from [Bootstrap Icons](https://icons.getbootstrap.com/) (MIT).
