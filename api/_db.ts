import { neon } from '@neondatabase/serverless';
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}
export function reply(res: any, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}
export function method(req: any, expected: string, res: any) {
  if (req.method === expected) return true;
  res.setHeader('Allow', expected);
  reply(res, 405, { error: 'Method not allowed' });
  return false;
}
export function jsonBody(req: any): any {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid JSON body');
  return body;
}
