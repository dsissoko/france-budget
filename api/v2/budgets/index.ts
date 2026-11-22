import {v2db,respond,safeError} from '../_db.js';

export default async function handler(req:any,res:any){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return respond(res,405,{error:'Méthode non autorisée'});}
  const origin=typeof req.query?.origin==='string'?req.query.origin:'';
  if(origin&&!['citizen','party','educational'].includes(origin))
    return respond(res,400,{error:'Origine invalide'});
  try{
    const sql=v2db();
    const rows=await sql`
      SELECT b.id,b.budget_key AS "budgetKey",b.version,b.origin,b.party_code AS "partyCode",
        b.title,b.description,b.author,b.reference_year AS "referenceYear",
        b.source_year AS "sourceYear",b.budget_mode AS "budgetMode",
        b.documentary,
        (SELECT count(*)::int FROM v2.budget_proposals p WHERE p.budget_id=b.id) AS "proposalCount",
        (SELECT count(*)::int FROM v2.budget_proposal_impacts i WHERE i.budget_id=b.id) AS "impactCount"
      FROM v2.latest_budgets b
      WHERE (${origin}='' OR b.origin=${origin})
      ORDER BY b.origin,b.budget_key LIMIT 500
    `;
    respond(res,200,{budgets:rows,version:'latest'});
  }catch(e){safeError(res,e);}
}
