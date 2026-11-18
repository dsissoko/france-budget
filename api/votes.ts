import { createHash, randomBytes } from 'node:crypto';
import { db, reply, method, jsonBody } from './_db';
export default async function handler(req: any, res: any) {
  if (!method(req, 'POST', res)) return;
  try {
    const body = jsonBody(req);
    if (typeof body.budgetId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.budgetId))
      return reply(res, 400, { error: 'Invalid budget ID' });
    const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((s: string) => {
      const i = s.indexOf('='); return i < 0 ? ['', ''] : [s.slice(0,i).trim(),s.slice(i+1).trim()];
    }));
    const existing = cookies.fb_voter;
    const voter = existing && /^[0-9a-f]{64}$/.test(existing) ? existing : randomBytes(32).toString('hex');
    if (voter !== existing) res.setHeader('Set-Cookie', `fb_voter=${voter}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
    const hash = createHash('sha256').update(voter).digest('hex');
    const sql = db();
    const rows = await sql`INSERT INTO votes (budget_id,voter_hash)
      SELECT id,${hash} FROM budgets WHERE id=${body.budgetId}::uuid
      AND origin='citizen' AND visibility='public'
      ON CONFLICT (budget_id,voter_hash) DO NOTHING RETURNING id`;
    return reply(res, rows.length ? 201 : 409, { voted: rows.length > 0 });
  } catch {
    return reply(res, 500, { error: 'Unable to process vote' });
  }
}
