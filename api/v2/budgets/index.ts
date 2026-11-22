import {v2db,respond,safeError} from '../_db.js';
import {makeCitizenKey,makeEditToken,hashEditToken,normalizeCitizenBody,
  sameOrigin,parseJsonBody,validatePivotImpacts,writeErrorStatus} from '../_citizen.js';

export default async function handler(req:any,res:any){
  if(req.method==='GET'){
    const origin=typeof req.query?.origin==='string'?req.query.origin:'';
    if(origin&&!['citizen','party','educational'].includes(origin))
      return respond(res,400,{error:'Origine invalide'});
    try{
      const sql=v2db();
      const rows=await sql`
        SELECT COALESCE(b.legacy_budget_id,b.id) AS id,b.budget_key AS "budgetKey",b.version,b.origin,b.party_code AS "partyCode",
          b.title,b.description,b.author,b.reference_year AS "referenceYear",
          b.source_year AS "sourceYear",b.budget_mode AS "budgetMode",
          b.documentary,b.revision,b.published_at AS "published_at",
          b.featured,b.featured_order,b.maturity_status,
          b.confirmation_organization,b.confirmation_evidence_url,b.confirmed_at,
          (SELECT count(*)::int FROM v2.votes v WHERE v.budget_id=b.id) AS votes,
          (SELECT count(*)::int FROM v2.budget_proposals p WHERE p.budget_id=b.id) AS "proposalCount",
          (SELECT count(*)::int FROM v2.budget_proposal_impacts i WHERE i.budget_id=b.id) AS "impactCount",
          (SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'proposalKey',p.proposal_key,'title',p.title,'description',p.description,
            'claimedAmountBn',p.claimed_amount_bn::text,'sourceUrl',p.source_url,
            'sourceStatus',p.source_status,
            'impacts',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'side',i.side,'categoryId',i.category_id,'deltaAmountBn',i.delta_amount_bn::text)
              ORDER BY i.side,i.category_id),'[]'::jsonb)
              FROM v2.budget_proposal_impacts i WHERE i.proposal_id=p.id)
          ) ORDER BY p.proposal_key),'[]'::jsonb)
          FROM v2.budget_proposals p WHERE p.budget_id=b.id) AS proposals
        FROM v2.latest_budgets b WHERE (${origin}='' OR b.origin=${origin})
        ORDER BY b.origin,b.budget_key LIMIT 500
      `;
      return respond(res,200,{budgets:rows,version:'latest'});
    }catch(e){return safeError(res,e);}
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return respond(res,405,{error:'Méthode non autorisée'});}
  if(!sameOrigin(req))return respond(res,403,{error:'Origine non autorisée'});
  try{
    const body=parseJsonBody(req);
    const key=makeCitizenKey();
    const payload=normalizeCitizenBody(body,key);
    const sql=v2db();
    if(body.sourceBudgetKey){
      const source=await sql`SELECT id,budget_key,title,budget_mode,documentary FROM v2.latest_budgets WHERE budget_key=${body.sourceBudgetKey} LIMIT 1`;
      if(!source.length)return respond(res,400,{error:'Budget de départ introuvable'});
      const p=await sql`SELECT p.proposal_key AS "proposalKey",p.title,p.description,
         (SELECT COALESCE(jsonb_agg(jsonb_build_object('side',i.side,'categoryId',i.category_id,
          'deltaAmountBn',i.delta_amount_bn::float8)),'[]'::jsonb) FROM v2.budget_proposal_impacts i WHERE i.proposal_id=p.id) AS impacts
         FROM v2.budget_proposals p WHERE p.budget_id=${source[0].id}::uuid`;
      payload.budget.documentary={citizenSource:{budgetKey:source[0].budget_key,
       title:source[0].title,budgetMode:source[0].budget_mode,
       aggregate:source[0].documentary?.aggregates?.[0]??null,
       proposals:p}};
    }
    const reference=await sql`SELECT side,category_id,reference_amount_bn::text
      FROM v2.reference_posts WHERE reference_year=2025`;
    validatePivotImpacts(payload.impacts,reference as any);
    const token=makeEditToken();
    const result=await sql`SELECT budget_id AS "id",new_revision AS "revision",
      new_status AS "status" FROM v2.write_citizen_budget(
        ${JSON.stringify(payload)}::jsonb,'create',${hashEditToken(token)},NULL)`;
    return respond(res,201,{budgetKey:key,...result[0],editToken:token});
  }catch(e){
    const status=writeErrorStatus(e);
    if(status===503)return safeError(res,e);
    return respond(res,status,{error:status===403?'Accès refusé':status===409?'Conflit':String((e as Error).message)});
  }
}
