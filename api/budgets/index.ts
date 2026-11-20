import { createHash } from 'node:crypto';
import { db, reply, method, jsonBody } from '../_db.js';
export default async function handler(req: any, res: any) {
 try {
  const sql=db();
  if(req.method==='GET'){
   const rows=await sql`SELECT b.id,b.title,b.description,b.origin,b.party_code,b.featured,b.featured_order,b.reference_year,b.published_at,b.scenario,
     count(v.id)::int AS votes FROM budgets b LEFT JOIN votes v ON v.budget_id=b.id
     WHERE b.origin IN ('citizen','party') AND b.visibility='public'
     GROUP BY b.id ORDER BY CASE WHEN b.origin='party' THEN 0 ELSE 1 END, votes DESC,b.published_at DESC LIMIT 103`;
   return reply(res,200,{budgets:rows,limit:100});
  }
  if(!method(req,'POST',res))return;
  const origin=req.headers.origin;const host=req.headers.host;
  if(origin&&new URL(origin).host!==host)return reply(res,403,{error:'Origine non autorisée'});
  const b=jsonBody(req);
  const [refs,offBudget]=await Promise.all([
   sql`SELECT id,side,amount::float8 AS amount FROM reference_categories WHERE reference_year=2025`,
   sql`SELECT id,amount::float8 AS amount FROM reference_off_budget`
  ]);
  const categories=new Map([...refs.map((x:any)=>[(x.side==='revenues'?'revenue:':'expense:')+x.id,x.amount]),...offBudget.map((x:any)=>['revenue:'+x.id,x.amount])]);
  if(typeof b.title!=='string'||b.title.trim().length<3||b.title.length>100||
    typeof b.description!=='string'||b.description.length>500||
    b.referenceYear!==2025||typeof b.scenario?.author!=='string'||b.scenario.author.trim().length<2||b.scenario.author.length>60||!Array.isArray(b.measures)||b.measures.length>100||
    !b.scenario||typeof b.scenario!=='object'||Array.isArray(b.scenario)||
    !b.scenario.budget||!Array.isArray(b.scenario.picked)||b.scenario.picked.length>30)
    return reply(res,400,{error:'Budget invalide'});
  if(!b.measures.every((m:any)=>m&&typeof m.title==='string'&&m.title.length>0&&m.title.length<=160&&
    typeof m.description==='string'&&m.description.length<=2000&&
    typeof m.categoryCode==='string'&&(m.kind==='revenue'||m.kind==='expense')&&
    Number.isFinite(m.deltaAmount)&&Number.isFinite(m.referenceAmount)&&
    categories.get(m.kind+':'+m.categoryCode)===m.referenceAmount&&
    m.deltaAmount>=-m.referenceAmount&&m.deltaAmount<=m.referenceAmount))
    return reply(res,400,{error:'Mesures invalides'});
  const expected=categories;
  if(!b.scenario.budget.revenues||!b.scenario.budget.expenses||
    !['revenues','expenses','offBudget'].every(kind=>Object.entries(b.scenario.budget[kind]??{}).every(([id,value])=>{
      const base=expected.get((kind==='expenses'?'expense:':'revenue:')+id);
      return base!==undefined&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=base*2;
    })))return reply(res,400,{error:'Montants invalides'});
  const canonical=JSON.stringify(b.scenario);
  if(canonical.length>25000)return reply(res,413,{error:'Budget trop volumineux'});
  const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  const fingerprint=createHash('sha256').update((process.env.DATABASE_URL||'')+':'+ip).digest('hex');
  const rows=await sql`SELECT public.publish_citizen_budget(${JSON.stringify({title:b.title.trim(),description:b.description,referenceYear:b.referenceYear,scenario:b.scenario,measures:b.measures})}::jsonb,${fingerprint}) AS id`;
  return reply(res,201,{id:rows[0].id});
 }catch(e){
  if(String(e).includes('publication_limit_reached'))return reply(res,409,{error:'Les 100 places sont occupées'});
  if(String(e).includes('publication_rate_limited'))return reply(res,429,{error:'Limite de 100 publications par 24 h atteinte'});
  return reply(res,500,{error:'Publication momentanément indisponible'});
 }
}
