# Contributing

Use Node.js 22.12+ (Node 24 is recommended) and pnpm 11.19.0.

1. Create a focused branch from `main`.
2. Install with `pnpm install --frozen-lockfile`.
3. Read [the architecture](docs/architecture.md) before changing authentication or persistence.
4. Run `pnpm test` and `pnpm build`.
5. For API changes, migrate and run local Wrangler, then run the integration suite with `TEST_BASE_URL=http://127.0.0.1:8787`.
6. Check desktop and mobile interactions, keyboard focus, and reduced motion.

Keep commits small and describe the behavior they change. A pull request should include the problem, solution, validation, and any migration requirements. Do not commit tokens, passwords, `.dev.vars`, local databases, or test account details.

## Curriculum

Lessons live in `src/data/`. Keep stable lesson/question IDs so existing progress remains valid. Include an explanation, concrete example, middle-level tradeoff, interview prompt, primary source, and justified distractors. Scores describe self-assessment, not certification. When changing answer meaning, consider whether saved results need a versioned migration.
