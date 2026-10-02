# Cloudflare deployment

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

At the time of initial setup, the published Free allowance includes 100,000 Worker requests/day, a 10 ms CPU limit per invocation, and D1 allowances of 5 million rows read/day, 100,000 rows written/day and 5 GB total storage (with a separate per-database size limit). Static asset requests are free. These values are not an SLA and can change: check [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Do not switch to Paid to resolve a quota error without the owner's approval. On Free, exceeding applicable limits can cause failed requests. The UI must report unsaved work clearly. Durable history grows with use; for a larger audience add retention, monitoring and reviewed abuse controls.

## Recovery and operations

- Check D1 Time Travel availability and retention in [the official documentation](https://developers.cloudflare.com/d1/reference/time-travel/) before relying on it.
- For a manual backup, use `wrangler d1 export interview-lab --remote --output=<private-backup.sql>` and keep the result outside public Git history. It contains user data and credential hashes.
- A Worker rollback does not roll back D1 schema or data. Prefer additive migrations and verify compatibility.
- The server's `POST` endpoints require the exact `Origin` and `Content-Type: application/json` headers; this is intentional CSRF protection.
