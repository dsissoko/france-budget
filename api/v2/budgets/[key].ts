import {v2db,respond,safeError} from '../_db.js';

export default async function handler(req:any,res:any){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return respond(res,405,{error:'Méthode non autorisée'});}
  const key=String(req.query?.key??'');
  if(!key||key.length>160||!/^[a-zA-Z0-9_.-]+$/.test(key))
    return respond(res,400,{error:'Identifiant de budget invalide'});
  try{
    const sql=v2db();
    const rows=await sql`
      SELECT id,budget_key AS "budgetKey",version,origin,party_code AS "partyCode",
        author,title,description,reference_year AS "referenceYear",source_year AS "sourceYear",
        budget_mode AS "budgetMode",documentary
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
    respond(res,200,{budget:{...budget,proposals}});
  }catch(e){safeError(res,e);}
}
