import { db, reply, method } from './_db.js';
export default async function handler(req:any,res:any){
 if(!method(req,'GET',res))return;
 try{
  const sql=db();
  const [categories,measures,offBudget,parties]=await Promise.all([
   sql`SELECT id,side,label,amount::float8 AS amount,canonical,description FROM reference_categories WHERE reference_year=2025 ORDER BY side,sort_order`,
   sql`SELECT m.legacy_id AS id,b.party_code AS party,m.theme,m.title,m.revenue_delta::float8 AS "revenueDelta",m.expense_delta::float8 AS "expenseDelta",m.apu_entries AS "apuEntries",m.source,m.reference_year AS year,m.status,m.description FROM measures m JOIN budgets b ON b.id=m.budget_id WHERE b.origin='party' AND b.visibility='public' AND b.party_code IS NOT NULL AND m.status='publié' AND m.legacy_id IS NOT NULL AND m.apu_entries IS NOT NULL ORDER BY b.featured_order NULLS LAST,b.party_code,m.created_at,m.legacy_id`,
   sql`SELECT id,label,amount::float8 AS amount,canonical,description,revenue_impact_category AS "revenueImpactCategory" FROM reference_off_budget ORDER BY sort_order`,
   sql`SELECT DISTINCT b.party_code AS code,COALESCE(r.formation_name,b.party_code) AS name FROM budgets b LEFT JOIN party_source_registry_draft r ON r.party_code=b.party_code WHERE b.origin='party' AND b.visibility='public' AND b.party_code IS NOT NULL ORDER BY name,code`
  ]);
  res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=300');
  return reply(res,200,{referenceYear:2025,revenues:categories.filter((x:any)=>x.side==='revenues').map(({side,...x}:any)=>x),expenses:categories.filter((x:any)=>x.side==='expenses').map(({side,...x}:any)=>x),offBudget,measures,parties});
 }catch(error){console.error('GET /api/reference failed',error);return reply(res,503,{error:'Référentiel temporairement indisponible'})}
}
