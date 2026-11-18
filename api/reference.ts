import { db, reply, method } from './_db';
export default async function handler(req:any,res:any){
 if(!method(req,'GET',res))return;
 try{
  const sql=db();
  const [categories,measures]=await sql.transaction([
   sql`SELECT id,side,label,amount::float8 AS amount,canonical,description FROM reference_categories WHERE reference_year=2025 ORDER BY side,sort_order`,
   sql`SELECT m.legacy_id AS id,CASE WHEN b.title LIKE 'Scénario RN %' THEN 'RN' WHEN b.title LIKE 'Scénario LFI %' THEN 'LFI' WHEN b.title LIKE 'Scénario Horizons %' THEN 'Horizons' END AS party,m.theme,m.title,m.revenue_delta::float8 AS "revenueDelta",m.expense_delta::float8 AS "expenseDelta",m.source,m.reference_year AS year,m.status,m.description FROM measures m JOIN budgets b ON b.id=m.budget_id WHERE b.origin='party' AND m.legacy_id IS NOT NULL ORDER BY CASE WHEN b.title LIKE 'Scénario RN %' THEN 1 WHEN b.title LIKE 'Scénario LFI %' THEN 2 ELSE 3 END,m.created_at,m.legacy_id`
  ],{readOnly:true});
  res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=300');
  return reply(res,200,{referenceYear:2025,revenues:categories.filter((x:any)=>x.side==='revenues').map(({side,...x}:any)=>x),expenses:categories.filter((x:any)=>x.side==='expenses').map(({side,...x}:any)=>x),measures});
 }catch{return reply(res,503,{error:'Référentiel temporairement indisponible'})}
}
