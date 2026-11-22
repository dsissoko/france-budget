import {createHash,randomBytes} from 'node:crypto';
import {v2db,respond,safeError} from './_db.js';
import {sameOrigin,parseJsonBody} from './_citizen.js';

export function voterFromCookies(raw:string):{token:string;fresh:boolean}{
  const parts=raw.split(';').map(p=>p.trim());
  const existing=parts.find(p=>p.startsWith('fb_voter='))?.slice('fb_voter='.length);
  if(existing&&/^[a-f0-9]{64}$/.test(existing))
    return {token:existing,fresh:false};
  return {token:randomBytes(32).toString('hex'),fresh:true};
}
export function validVoteId(value:unknown):boolean{
  return typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8a-f][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
}

export default async function handler(req:any,res:any){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(res,405,{error:'Méthode non autorisée'});}
  if(!sameOrigin(req))return respond(res,403,{error:'Origine non autorisée'});
  let budgetId:string;
  try{
    const body=parseJsonBody(req);
    budgetId=body.budgetId;
    if(!validVoteId(budgetId))return respond(res,400,{error:'Identifiant invalide'});
  }catch{return respond(res,400,{error:'JSON invalide'});}
  try{
    const sql=v2db();
    const {token,fresh}=voterFromCookies(String(req.headers.cookie||''));
    const hash=createHash('sha256').update(token).digest('hex');
    const result=await sql`
      INSERT INTO v2.votes(budget_id,voter_hash)
      SELECT id,${hash} FROM v2.latest_budgets
      WHERE id=${budgetId}::uuid AND origin IN ('citizen','party')
      ON CONFLICT(budget_id,voter_hash) DO NOTHING
      RETURNING id
    `;
    if(fresh)res.setHeader('Set-Cookie',
      `fb_voter=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
    return respond(res,result.length?201:409,{voted:result.length>0});
  }catch(e){return safeError(res,e);}
}
