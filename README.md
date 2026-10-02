# Interview Lab

[![CI](https://github.com/VasilievNichita/interview-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/VasilievNichita/interview-lab/actions/workflows/ci.yml)

**[Open the live app](https://interview-lab.interview-lab.workers.dev)**

A Russian-language fullstack theory learning app: **read → understand an example → answer questions → review mistakes → track progress**.

Built for junior interview preparation with additional middle-level tradeoffs. The curriculum expands a colleague's original `it-roadmap.html` checklist into 39 lessons across nine chapters. The original file is not redistributed; lesson explanations, interface and application code were created for this project with AI assistance.

![Interview Lab desktop learning dashboard](docs/screenshots/desktop.jpg)

[Mobile screenshot](docs/screenshots/mobile.jpg)

## Features

- 39 lessons covering web fundamentals, business systems, web/desktop architecture, mobile, databases, infrastructure, observability, security and system design.
- Explanations, examples, flow diagrams, primary documentation links and deeper technical tradeoffs in each lesson.
- 117 questions, including 39 applied scenarios; lesson quizzes, nine chapter exams and one 39-question final exam, with answer explanations and unlimited repeats.
- Interview flashcards for spoken answers and self-assessment.
- Registration, login and one-time-code password recovery.
- Account-backed reading progress, best scores, mastery totals and recent attempt history across devices.
- Guest learning and quizzes, responsive dark interface, keyboard access and reduced-motion support.

## Stack

React 19 · TypeScript · Vite · Cloudflare Workers · D1/SQLite · Lucide icons · Node test runner

The app has no Google Drive dependency and does not require a permanent server process in production. There are no paid external service dependencies.

## Run locally

Requirements: Node.js 22.12+ (recommended: 24), pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm db:local
pnpm preview
```

Open `http://localhost:8787`. Local D1 data is stored in ignored `.wrangler/` files and is separate from production. No Cloudflare account is required for local development.

For hot reload, keep Wrangler running and run `pnpm dev` in another terminal. Vite proxies `/api` to Wrangler on port 8787. For production-equivalent browser QA use the Wrangler URL after `pnpm build`.

## Tests

```sh
pnpm test
pnpm build
# With local Wrangler running:
TEST_BASE_URL=http://127.0.0.1:8787 pnpm test
```

PowerShell:

```powershell
$env:TEST_BASE_URL = 'http://127.0.0.1:8787'
pnpm test
```

Integration checks create disposable accounts **only in a localhost database** and refuse production URLs. They exercise session persistence, ownership isolation, server-side scoring, password recovery, and revocation. Without `TEST_BASE_URL`, integration checks are explicitly skipped.

## Project structure

```text
src/main.tsx          Application views and interactions
src/style.css        Responsive design system
src/data/            Typed lessons, questions and chapter catalog
server/index.ts      Worker routes, ownership and persistence
server/security.ts   Credential/session primitives
server/grading.ts    Server-authoritative quiz grading
migrations/          Versioned D1 schema
tests/               Unit and local HTTP integration checks
docs/                Architecture and deployment decisions
```

See [Architecture](docs/architecture.md), [Deployment](docs/deployment.md), [Security](SECURITY.md) and [Contributing](CONTRIBUTING.md).

## Scope and limitations

This course is a conceptual foundation based on the supplied roadmap, not a complete coding bootcamp or a claim of middle-level professional readiness. Exam scores are learning feedback, not certification. Email ownership is not verified; recovery uses the code shown during registration instead of email delivery. Save that code securely. Free Cloudflare services have quotas; availability beyond them is not guaranteed. See the security document for authentication tradeoffs and the deployment guide for plan details.

## License and attribution

MIT © 2026 [VasilievNichita](https://github.com/VasilievNichita). Lucide icons are ISC-licensed. Linked documentation belongs to its respective authors; lessons use original explanations, not copied articles.
