import { neon } from '@neondatabase/serverless';

export function v2db() {
  // Never fall back to DATABASE_URL: that belongs to production V1.
  const url=process.env.V2_DATABASE_URL;
  if(!url)throw new Error('V2_DATABASE_URL not configured');
  return neon(url);
}
export function respond(res:any,status:number,body:unknown){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(body));
}
export function safeError(res:any,err:unknown){
  console.error('V2 backend read failure',err);
  respond(res,503,{error:'Backend V2 momentanément indisponible'});
}
