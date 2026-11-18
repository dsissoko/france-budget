import { db, reply, method, jsonBody } from '../_db';
import { expenses, revenues } from '../../src/data';
const categories = new Map([...expenses.map(x=>['expense:'+x.id,x.amount] as const),...revenues.map(x=>['revenue:'+x.id,x.amount] as const)]);
export default async function handler(req: any, res: any) {
 try {
  const sql=db();
  if(req.method==='GET'){
   const rows=await sql`SELECT b.id,b.title,b.description,b.reference_year,b.published_at,b.scenario,
     count(v.id)::int AS votes FROM budgets b LEFT JOIN votes v ON v.budget_id=b.id
     WHERE b.origin='citizen' AND b.visibility='public'
     GROUP BY b.id ORDER BY votes DESC,b.published_at DESC LIMIT 50`;
   return reply(res,200,{budgets:rows,limit:50});
  }
  if(!method(req,'POST',res))return;
  const b=jsonBody(req);
  if(typeof b.title!=='string'||b.title.trim().length<3||b.title.length>100||
    typeof b.description!=='string'||b.description.length>500||
    b.referenceYear!==2025||!Array.isArray(b.measures)||b.measures.length>100||
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
  const canonical=JSON.stringify(b.scenario);
  if(canonical.length>25000)return reply(res,413,{error:'Budget trop volumineux'});
  const rows=await sql`SELECT public.publish_citizen_budget(${JSON.stringify({title:b.title.trim(),description:b.description,referenceYear:b.referenceYear,scenario:b.scenario,measures:b.measures})}::jsonb) AS id`;
  return reply(res,201,{id:rows[0].id});
 }catch(e){
  if(String(e).includes('publication_limit_reached'))return reply(res,409,{error:'Les 50 places sont occupées'});
  return reply(res,500,{error:'Publication momentanément indisponible'});
 }
}
