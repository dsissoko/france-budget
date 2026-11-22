import {v2db,respond,safeError} from '../_db.js';
import {sameOrigin,editToken,hashEditToken,parseJsonBody,parseRevision,
  normalizeCitizenBody,validatePivotImpacts,writeErrorStatus} from '../_citizen.js';
export default async function handler(req:any,res:any){
  const key=String(req.query?.key??'');
  if(!key||key.length>160||!/^[a-zA-Z0-9_.-]+$/.test(key))
    return respond(res,400,{error:'Identifiant de budget invalide'});
  if(req.method==='GET'){
    try{
      const sql=v2db();
      const rows=await sql`
        SELECT id,budget_key AS "budgetKey",version,origin,party_code AS "partyCode",
          author,title,description,reference_year AS "referenceYear",source_year AS "sourceYear",
          budget_mode AS "budgetMode",documentary,revision
        FROM v2.latest_budgets WHERE budget_key=${key} LIMIT 1`;
      if(!rows.length)return respond(res,404,{error:'Budget introuvable'});
      const budget=rows[0];
      const proposals=await sql`
        SELECT p.id,p.proposal_key AS "proposalKey",p.title,p.description,
          p.claimed_amount_bn::text AS "claimedAmountBn",p.source_url AS "sourceUrl",
          p.source_year AS "sourceYear",p.direction,p.amount_unit AS "amountUnit",
          p.source_section AS "sourceSection",p.source_status AS "sourceStatus",
          p.source_origin AS "sourceOrigin",p.source_excerpt AS "sourceExcerpt",p.notes,
          (SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'side',i.side,'categoryId',i.category_id,'deltaAmountBn',i.delta_amount_bn::text)
            ORDER BY i.side,i.category_id),'[]'::jsonb)
           FROM v2.budget_proposal_impacts i WHERE i.proposal_id=p.id) AS impacts
        FROM v2.budget_proposals p WHERE p.budget_id=${budget.id}::uuid
        ORDER BY p.proposal_key`;
      return respond(res,200,{budget:{...budget,proposals}});
    }catch(e){return safeError(res,e);}
  }
  if(req.method!=='PATCH'&&req.method!=='DELETE'){
    res.setHeader('Allow','GET, PATCH, DELETE');return respond(res,405,{error:'Méthode non autorisée'});
  }
  if(!sameOrigin(req))return respond(res,403,{error:'Origine non autorisée'});
  const token=editToken(req);
  if(!token)return respond(res,403,{error:'Clé d’édition obligatoire'});
  if(!/^citizen-[0-9a-f-]{36}$/.test(key))return respond(res,403,{error:'Budget non modifiable'});
  try{
    const body=parseJsonBody(req);
    const revision=parseRevision(body.revision);
    const sql=v2db();
    let payload:any={budget:{budget_key:key}};
    if(req.method==='PATCH'){
      payload=normalizeCitizenBody(body,key);
      const refs=await sql`SELECT side,category_id,reference_amount_bn::text
        FROM v2.reference_posts WHERE reference_year=2025`;
      validatePivotImpacts(payload.impacts,refs as any);
    }
    const operation=req.method==='DELETE'?'withdraw':'update';
    const rows=await sql`SELECT budget_id AS "id",new_revision AS "revision",
      new_status AS "status" FROM v2.write_citizen_budget(
        ${JSON.stringify(payload)}::jsonb,${operation},${hashEditToken(token)},${revision})`;
    return respond(res,200,{budgetKey:key,...rows[0]});
  }catch(e){
    const status=writeErrorStatus(e);
    if(status===503)return safeError(res,e);
    return respond(res,status,{error:status===403?'Accès refusé':status===409?'Conflit':String((e as Error).message)});
  }
}
