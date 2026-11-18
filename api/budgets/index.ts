import { db, reply, method, jsonBody } from '../_db';
export default async function handler(req: any, res: any) {
  try {
    const sql = db();
    if (req.method === 'GET') {
      const rows = await sql`SELECT b.id,b.title,b.description,b.reference_year,b.published_at,
        count(v.id)::int AS votes
        FROM budgets b LEFT JOIN votes v ON v.budget_id=b.id
        WHERE b.origin='citizen' AND b.visibility='public'
        GROUP BY b.id ORDER BY votes DESC,b.published_at DESC LIMIT 50`;
      return reply(res, 200, { budgets: rows });
    }
    if (!method(req, 'POST', res)) return;
    const b = jsonBody(req);
    if (typeof b.title !== 'string' || b.title.trim().length < 3 || b.title.length > 160 ||
        typeof b.description !== 'string' || b.description.length > 3000 ||
        !Number.isInteger(b.referenceYear) || b.referenceYear < 2000 || b.referenceYear > 2100 ||
        !Array.isArray(b.measures) || b.measures.length > 100 ||
        !b.measures.every((m: any) => m && typeof m.title === 'string' && m.title.length <= 160 &&
          typeof m.categoryCode === 'string' && /^[a-z0-9_-]{1,80}$/.test(m.categoryCode) &&
          (m.kind === 'revenue' || m.kind === 'expense') &&
          Number.isFinite(m.deltaAmount) && Number.isFinite(m.referenceAmount) &&
          m.referenceAmount >= 0 && Math.abs(m.deltaAmount) <= m.referenceAmount &&
          m.deltaAmount <= m.referenceAmount &&
          m.referenceAmount <= 100000 &&
          typeof m.description === 'string' && m.description.length <= 2000))
      return reply(res, 400, { error: 'Invalid budget' });
    // One SQL statement: capacity check and insertion are serialized by a transaction-scoped advisory lock.
    // The public limit is enforced in SQL, not in the browser.
    // Measures are saved in the scenario snapshot until the publication transaction is expanded.
    const scenario = JSON.stringify({ measures: b.measures });
    if (scenario.length > 100000) return reply(res, 413, { error: 'Budget too large' });
    const rows = await sql`WITH lock AS (SELECT pg_advisory_xact_lock(8729104)),
      capacity AS (SELECT count(*) AS n FROM budgets, lock WHERE origin='citizen' AND visibility='public')
      INSERT INTO budgets (title,description,origin,visibility,reference_year,scenario)
      SELECT ${b.title.trim()},${b.description},'citizen','public',${b.referenceYear},${scenario}::jsonb
      FROM capacity WHERE n < 50 RETURNING id`;
    if (!rows.length) return reply(res, 409, { error: 'Publication limit reached' });
    return reply(res, 201, { id: rows[0].id });
  } catch {
    return reply(res, 500, { error: 'Unable to process request' });
  }
}
