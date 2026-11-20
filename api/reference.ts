import { db, reply, method } from './_db.js';
export default async function handler(req:any,res:any){
 if(!method(req,'GET',res))return;
 try{
  const sql=db();
  const [categories,measures,offBudget]=await Promise.all([
   sql`SELECT id,side,label,amount::float8 AS amount,canonical,description FROM reference_categories WHERE reference_year=2025 ORDER BY side,sort_order`,
   sql`SELECT m.legacy_id AS id,CASE WHEN b.title LIKE 'Scénario RN %' THEN 'RN' WHEN b.title LIKE 'Scénario LFI %' THEN 'LFI' WHEN b.title LIKE 'Scénario Horizons %' THEN 'Horizons' END AS party,m.theme,m.title,m.revenue_delta::float8 AS "revenueDelta",m.expense_delta::float8 AS "expenseDelta",m.source,m.reference_year AS year,m.status,m.description FROM measures m JOIN budgets b ON b.id=m.budget_id WHERE b.origin='party' AND b.visibility='public' AND m.status='publié' AND m.legacy_id IS NOT NULL ORDER BY CASE WHEN b.title LIKE 'Scénario RN %' THEN 1 WHEN b.title LIKE 'Scénario LFI %' THEN 2 ELSE 3 END,m.created_at,m.legacy_id`,
   sql`SELECT id,label,amount::float8 AS amount,canonical,description,revenue_impact_category AS "revenueImpactCategory" FROM reference_off_budget ORDER BY sort_order`
  ]);
  res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=300');
  return reply(res,200,{referenceYear:2025,revenues:categories.filter((x:any)=>x.side==='revenues').map(({side,...x}:any)=>x),expenses:categories.filter((x:any)=>x.side==='expenses').map(({side,...x}:any)=>x),offBudget,measures});
 }catch(error){console.error('GET /api/reference failed',error);return reply(res,503,{error:'Référentiel temporairement indisponible'})}
}
