# Cloudflare deployment

Live deployment: [app.duskwarden.workers.dev](https://app.duskwarden.workers.dev). Initial release: October 2, 2026 (Europe/Chisinau). The original deployment was verified with a disposable account: registration, secure session cookie, server grading, progress read from a separate login, and logout. The disposable account was removed after verification.

## Address and device access

The Worker is named `app`, and the account's workers.dev subdomain is `duskwarden`. The database remains `interview-lab` with its original ID; renaming the public address does not migrate or recreate progress. The GitHub repository URL also remains unchanged.

The same HTTPS address works on phones, tablets and computers. Browser cookies and localStorage belong to each origin, so restore an existing profile with its secret transfer code on the new address: **«Выбрать героя» → «У меня есть код переноса»**. Name alone does not recover a profile. Cloudflare account-subdomain changes affect every Worker address in that account; the former `interview-lab.interview-lab.workers.dev` address is retired.

The address change was verified by creating a disposable profile and reading a lesson on the old hostname, then restoring the same profile, race and reading status on the new hostname. HTTPS certificate validation remained enabled. A resolver may temporarily cache an NXDOMAIN result queried before the new name existed; allow its negative-cache entry to expire. The Workers and D1 records are unaffected by DNS propagation.

The intended environment is **Workers Free + D1 Free**. No paid plan, domain purchase, card entry, paid add-on or subscription change is part of setup. A `workers.dev` subdomain provides HTTPS without purchasing a domain. Check the account's active plan before deploying. If it is already Paid, its account-level billing rules apply; merely setting a small CPU limit does not enforce a zero-dollar bill.

## First deployment

```sh
pnpm install --frozen-lockfile
pnpm exec wrangler login --device --scopes account:read user:read workers:write workers_scripts:write d1:write
pnpm exec wrangler d1 create interview-lab
# Put the returned database_id in wrangler.jsonc.
pnpm db:remote
pnpm build
pnpm exec wrangler deploy
```

OAuth credentials stay in Wrangler's user configuration outside this repository. `database_id` is an identifier, not a credential. Forks must create their own database and replace the binding ID. Never use another deployment's database for tests.

## Subsequent releases

Run checks, apply backward-compatible migrations, build and deploy. Check the live homepage and `/api/health`, then verify sign-in and progress with a controlled account. The repository CI checks the code but does not possess production credentials or deploy automatically. Deployment remains an explicit maintainer command.

## Free quotas

The optional `AI` binding uses `@cf/qwen/qwen2.5-coder-32b-instruct`. Workers AI currently provides 10,000 neurons/day on Free; beyond the allowance, inference fails rather than automatically upgrading the plan. See [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/). The app additionally caps model attempts at 60 per day across the deployment and 20 mentor requests/hour per profile, with a 1,000-token output limit and a 25-second response deadline. These caps do not guarantee a particular provider usage total; keep the account on Free. No paid fallback or external API key is configured. Course excerpts are returned with a clear notice on failure. AI bindings access remote inference even during local development.

Apply migration `0003_companion_profiles.sql` before deploying the profile/companion release. It adds a race column and transfer-digest index without replacing users or progress. Verify the production mentor separately from unit tests: tests intentionally mock inference and cannot prove provider access.

At the time of initial setup, the published Free allowance includes 100,000 Worker requests/day, a 10 ms CPU limit per invocation, and D1 allowances of 5 million rows read/day, 100,000 rows written/day and 5 GB total storage (with a separate per-database size limit). Static asset requests are free. These values are not an SLA and can change: check [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Do not switch to Paid to resolve a quota error without the owner's approval. On Free, exceeding applicable limits can cause failed requests. The UI must report unsaved work clearly. Durable history grows with use; for a larger audience add retention, monitoring and reviewed abuse controls.

## Recovery and operations

The companion release was verified with a disposable production profile: name/race creation, saved reading status, restoration into a separate session and a real Russian AI answer to a UML question. The QA profile and its dependent data were then removed. No billing settings were changed.

- Check D1 Time Travel availability and retention in [the official documentation](https://developers.cloudflare.com/d1/reference/time-travel/) before relying on it.
- For a manual backup, use `wrangler d1 export interview-lab --remote --output=<private-backup.sql>` and keep the result outside public Git history. It contains user data and credential hashes.
- A Worker rollback does not roll back D1 schema or data. Prefer additive migrations and verify compatibility.
- The server's `POST` endpoints require the exact `Origin` and `Content-Type: application/json` headers; this is intentional CSRF protection.
