import {v2db,respond,safeError} from '../../_db.js';

// Read-only position effects. NOT the multi-year simulation engine.
// AGGREGATE claims are documentary and must never be added to proposal impacts.
export default async function handler(req:any,res:any){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return respond(res,405,{error:'Méthode non autorisée'});}
  const key=String(req.query?.key??'');
  if(!key||key.length>160||!/^[a-zA-Z0-9_.-]+$/.test(key))
    return respond(res,400,{error:'Identifiant invalide'});
  try{
    const sql=v2db();
    const budgets=await sql`SELECT id,budget_key AS "budgetKey",version,budget_mode AS "budgetMode",
      reference_year AS "referenceYear",documentary
      FROM v2.latest_budgets WHERE budget_key=${key} LIMIT 1`;
    if(!budgets.length)return respond(res,404,{error:'Budget introuvable'});
    const b=budgets[0];
    if(b.budgetMode==='AGGREGATE')
      return respond(res,200,{budgetKey:b.budgetKey,version:b.version,budgetMode:'AGGREGATE',
        accountingStatus:'documentary_aggregate_only',declaredAggregates:b.documentary?.aggregates??[],
        positions:[]});
    const positions=await sql`
      SELECT r.side,r.category_id AS "categoryId",r.label,
        r.reference_amount_bn::text AS "referenceAmountBn",
        COALESCE(i.delta_amount_bn,0)::text AS "deltaAmountBn",
        (r.reference_amount_bn+COALESCE(i.delta_amount_bn,0))::text AS "resultAmountBn"
      FROM v2.reference_posts r
      LEFT JOIN v2.budget_proposal_impacts i ON
        i.budget_id=${b.id}::uuid AND i.reference_year=r.reference_year
        AND i.side=r.side AND i.category_id=r.category_id
      WHERE r.reference_year=${b.referenceYear}
      ORDER BY r.side,r.category_id
    `;
    respond(res,200,{budgetKey:b.budgetKey,version:b.version,budgetMode:b.budgetMode,
      accountingStatus:'pivot_positions_only',positions});
  }catch(e){safeError(res,e);}
}
