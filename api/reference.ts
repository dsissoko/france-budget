import { db, reply, method } from './_db.js';
export default async function handler(req:any,res:any){
 if(!method(req,'GET',res))return;
 try{
  const sql=db();
  const [categories,measures,offBudget,parties,parameters]=await Promise.all([
   sql`SELECT id,side,label,amount::float8 AS amount,canonical,description FROM reference_categories WHERE reference_year=2025 ORDER BY side,sort_order`,
   sql`SELECT COALESCE(m.legacy_id,m.id::text) AS id,b.party_code AS party,m.theme,m.title,m.revenue_delta::float8 AS "revenueDelta",m.expense_delta::float8 AS "expenseDelta",(SELECT COALESCE(jsonb_agg(jsonb_build_object('side',e.side,'categoryId',e.category_id,'amount',e.amount::float8) ORDER BY e.line_number),'[]'::jsonb) FROM measure_accounting_entries e WHERE e.measure_id=m.id) AS "apuEntries",m.source,m.reference_year AS year,m.status,m.description,
   CASE WHEN m.legacy_id IS NOT NULL THEN true ELSE
      EXISTS (
        SELECT 1 FROM proposal_accounting_measures pam
        JOIN party_proposals pp ON (pp.party_code,pp.source_year,pp.group_id)=(pam.party_code,pam.source_year,pam.group_id)
        JOIN source_accounting_links sal ON sal.measure_id=pam.measure_id
        JOIN party_source_lines sl ON (sl.party_code,sl.source_year,sl.source_row)=(sal.party_code,sal.source_year,sal.source_row)
        WHERE pam.measure_id=m.id AND pp.review_status='validated'
          AND sl.validation_status='validated' AND sl.apu_decision='calculate'
          AND NOT EXISTS (
            SELECT 1 FROM party_source_lines pending
            WHERE (pending.party_code,pending.source_year,pending.group_id)=(pam.party_code,pam.source_year,pam.group_id)
              AND (pending.validation_status<>'validated' OR pending.apu_decision IS NULL)
          )
          AND NOT EXISTS (
            SELECT 1 FROM party_source_lines calc
            WHERE (calc.party_code,calc.source_year,calc.group_id)=(pam.party_code,pam.source_year,pam.group_id)
              AND calc.apu_decision='calculate'
              AND NOT EXISTS (
                SELECT 1 FROM source_accounting_links linked
                WHERE (linked.party_code,linked.source_year,linked.source_row)=(calc.party_code,calc.source_year,calc.source_row)
              )
          )
      ) END AS "sourceValidated"
   FROM measures m JOIN budgets b ON b.id=m.budget_id WHERE b.origin='party' AND b.visibility='public' AND b.party_code IS NOT NULL AND m.status='publié' ORDER BY b.featured_order NULLS LAST,b.party_code,m.created_at,m.legacy_id`,
   sql`SELECT id,label,amount::float8 AS amount,canonical,description,revenue_impact_category AS "revenueImpactCategory" FROM reference_off_budget ORDER BY sort_order`,
   sql`SELECT DISTINCT b.party_code AS code,p.name AS name FROM budgets b JOIN political_parties p ON p.code=b.party_code WHERE b.origin='party' AND b.visibility='public' AND b.party_code IS NOT NULL ORDER BY name,code`,
   sql`SELECT rv.id AS version,rv.reference_year AS "referenceYear",mp.parameter_key AS key,mp.numeric_value::float8 AS value FROM reference_versions rv JOIN model_parameters mp ON mp.reference_version_id=rv.id WHERE rv.status='active' AND rv.reference_year=2025 AND mp.model_id='mechanical-v1' ORDER BY rv.published_at DESC,rv.id DESC`
  ]);
  const version=parameters[0]?.version;
  const paramRows=parameters.filter((p:any)=>p.version===version);
  const params=Object.fromEntries(paramRows.map((p:any)=>[p.key,p.value]));
  if(!version||new Set(paramRows.map((p:any)=>p.key)).size!==4||!['baselineRatePerIndex','budgetYear','applicationYear','horizonYear'].every(k=>Number.isFinite(params[k]))||params.baselineRatePerIndex<0||params.baselineRatePerIndex>1||![params.budgetYear,params.applicationYear,params.horizonYear].every(Number.isInteger)||params.horizonYear<2025||params.horizonYear>2100||params.applicationYear>params.horizonYear)throw new Error('Paramètres de simulation Neon invalides');
  const categoryKeys=new Set(categories.map((c:any)=>c.side+':'+c.id));
  // Cohérence tout-ou-rien : une ventilation APU incohérente ne doit pas
  // générer un déficit partiel ou présenter une mesure comme validée.
  for(const m of measures){
   if(!m.sourceValidated)throw new Error('Mesure non validée documentairement : '+m.id);
   const entries=m.apuEntries as Array<{side:string;categoryId:string;amount:number}>;
   if(entries.some(e=>!['revenues','expenses'].includes(e.side)||!categoryKeys.has(e.side+':'+e.categoryId)||!Number.isFinite(e.amount)))
     throw new Error('Catégorie ou montant APU invalide : '+m.id);
   const revenueDelta=entries.filter(e=>e.side==='revenues').reduce((s,e)=>s+e.amount,0);
   const expenseDelta=entries.filter(e=>e.side==='expenses').reduce((s,e)=>s+e.amount,0);
   if(!entries.length || Math.abs(revenueDelta-m.revenueDelta)>0.001 ||
       Math.abs(expenseDelta-m.expenseDelta)>0.001)
     throw new Error('Incohérence APU mesure '+m.id);
  }
  res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=300');
  return reply(res,200,{referenceYear:2025,referenceVersion:version,simulation:{referenceYear:2025,...params},revenues:categories.filter((x:any)=>x.side==='revenues').map(({side,...x}:any)=>x),expenses:categories.filter((x:any)=>x.side==='expenses').map(({side,...x}:any)=>x),offBudget,measures:measures.map(({sourceValidated,...m}:any)=>({...m,referenceOrigin:'neon'})),parties});
 }catch(error){console.error('GET /api/reference failed',error);return reply(res,503,{error:'Référentiel temporairement indisponible'})}
}
