import {v2db,respond,safeError} from './_db.js';

export default async function handler(req:any,res:any){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return respond(res,405,{error:'Méthode non autorisée'});}
 try{
  const sql=v2db();
  const [posts,params]=await Promise.all([
   sql`SELECT side,category_id AS id,label,reference_amount_bn::float8 AS amount,
      canonical,description,sort_order AS "sortOrder",
      revenue_impact_category AS "revenueImpactCategory",source_year AS "sourceYear"
      FROM v2.reference_posts WHERE reference_year=2025 ORDER BY side,sort_order,category_id`,
   sql`SELECT reference_year AS "referenceYear",reference_version AS "referenceVersion",
      baseline_rate_per_index::float8 AS "baselineRatePerIndex",
      budget_year AS "budgetYear",application_year AS "applicationYear",
      horizon_year AS "horizonYear",balance_threshold::float8 AS "balanceThreshold",
      change_threshold::float8 AS "changeThreshold",
      momentum_threshold::float8 AS "momentumThreshold"
      FROM v2.reference_parameters WHERE reference_year=2025 LIMIT 1`
  ]);
  if(posts.length!==27||!params.length||
     posts.some((p:any)=>!p.description||!p.canonical||
       p.side==='offBudget'&&!p.revenueImpactCategory))
    return respond(res,503,{error:'Référentiel V2 incomplet'});
  const p=params[0] as any;
  const simulation={referenceYear:p.referenceYear,budgetYear:p.budgetYear,
    applicationYear:p.applicationYear,horizonYear:p.horizonYear,
    baselineRatePerIndex:p.baselineRatePerIndex,
    assessment:{balanceThreshold:p.balanceThreshold,changeThreshold:p.changeThreshold,
      momentumThreshold:p.momentumThreshold}};
  return respond(res,200,{referenceYear:p.referenceYear,referenceVersion:p.referenceVersion,
    simulation,
    revenues:posts.filter((x:any)=>x.side==='revenues').map(({side,sortOrder,sourceYear,revenueImpactCategory,...x}:any)=>x),
    expenses:posts.filter((x:any)=>x.side==='expenses').map(({side,sortOrder,sourceYear,revenueImpactCategory,...x}:any)=>x),
    offBudget:posts.filter((x:any)=>x.side==='offBudget').map(({side,sortOrder,...x}:any)=>x),
    posts});
 }catch(e){return safeError(res,e);}
}
