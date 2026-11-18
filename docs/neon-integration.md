# France Budget — Neon / Vercel integration (work in progress)

This feature branch adds initial serverless endpoints, **not yet production-ready**.

## Endpoints
- `GET /api/budgets`: up to 50 published citizen budgets and vote counts.
- `POST /api/budgets`: publish an immutable anonymous snapshot.
- `POST /api/votes`: one vote per budget and browser cookie (best-effort).

## Security and remaining work
- Configure `DATABASE_URL` **only** in Vercel server-side environment settings; never use `VITE_` or commit its value.
- Use a least-privilege PostgreSQL role for the app, not the database owner.
- The publication handler currently stores measures in `budgets.scenario` as JSON. The `measures` relational table is not yet populated; normalize it in a transaction before release.
- Add server-side rate limiting for publication and voting, plus anti-abuse and administrative takedown controls.
- Review concurrent publication cap under load; do not rely on browser-side enforcement.
- Validate payload semantics against canonical categories and reference amounts; current checks are only structural.
- Connect UI, add integration tests, configure Vercel and verify deployment before merging.
- Never promise strict one-person-one-vote without authentication; cookies can be reset.
- Published budgets are immutable for citizens; admins may need to remove illegal content.
