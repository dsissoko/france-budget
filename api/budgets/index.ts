import { createHash } from 'node:crypto';
import { db, reply, method, jsonBody } from '../_db.js';
export default async function handler(req: any, res: any) {
 try {
  const sql=db();
  if(req.method==='GET'){
   const rows=await sql`SELECT b.id,b.title,b.description,b.origin,b.party_code,b.maturity_status,b.confirmation_organization,b.confirmation_evidence_url,b.confirmed_at,b.featured,b.featured_order,b.reference_year,b.published_at,b.scenario,b.budget_mode::text AS "budgetMode",b.budget_mode::text AS "budgetMode",
     CASE WHEN b.origin='party' THEN
       (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id',p.group_id,'title',p.title,'year',p.source_year,
          'sourceCount',p.source_measure_count,'description',p.description,'reviewStatus',p.review_status,
          'citizenImpacts',COALESCE(to_jsonb(p)->'citizen_impacts','[]'::jsonb),
          'sourceLines',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'id',l.source_row,'title',l.title,'direction',l.direction,
             'claimedAmountBn',l.claimed_amount_bn,'impactDescription',l.impact_description,'sourceUrl',l.source_url,
             'sourcePage',(to_jsonb(l)->>'source_page')::integer,
             'validationStatus',l.validation_status,'apuDecision',l.apu_decision,
             'accountingMeasureId',(SELECT sal.measure_id::text FROM source_accounting_links sal
               WHERE (sal.party_code,sal.source_year,sal.source_row)=(l.party_code,l.source_year,l.source_row)
               LIMIT 1)
           ) ORDER BY l.source_row),'[]'::jsonb)
           FROM party_source_lines l WHERE (l.party_code,l.source_year,l.group_id)=(p.party_code,p.source_year,p.group_id)),
          'sourceUrl',COALESCE(p.source_url,(SELECT MIN(l.source_url) FROM party_source_lines l
                       WHERE (l.party_code,l.source_year,l.group_id)=(p.party_code,p.source_year,p.group_id)))
        ) ORDER BY p.source_year DESC,p.group_id),'[]'::jsonb)
        FROM party_proposals p WHERE p.party_code=b.party_code
         AND EXISTS(SELECT 1 FROM party_source_lines l WHERE l.party_code=p.party_code AND l.source_year=p.source_year AND l.group_id=p.group_id)
         AND p.source_year=COALESCE((b.scenario->'claimedTotals'->>'year')::int,(SELECT MAX(q.source_year) FROM party_proposals q WHERE q.party_code=b.party_code)))
     ELSE '[]'::jsonb END AS "documentaryProposals",
     count(v.id)::int AS votes FROM budgets b LEFT JOIN votes v ON v.budget_id=b.id
     WHERE b.origin IN ('citizen','party') AND b.visibility='public'
     GROUP BY b.id ORDER BY CASE WHEN b.origin='party' THEN 0 ELSE 1 END, votes DESC,b.published_at DESC LIMIT 103`;
   return reply(res,200,{budgets:rows,limit:100});
  }
  if(!method(req,'POST',res))return;
  const origin=req.headers.origin;const host=req.headers.host;
  if(origin&&new URL(origin).host!==host)return reply(res,403,{error:'Origine non autorisée'});
  const b=jsonBody(req);
  const [refs,offBudget]=await Promise.all([
   sql`SELECT id,side,amount::float8 AS amount FROM reference_categories WHERE reference_year=2025`,
   sql`SELECT id,amount::float8 AS amount FROM reference_off_budget`
  ]);
  const categories=new Map<string,number>([...refs.map((x:any):[string,number]=>[(x.side==='revenues'?'revenue:':'expense:')+x.id,Number(x.amount)]),...offBudget.map((x:any):[string,number]=>['revenue:'+x.id,Number(x.amount)])]);
  if(typeof b.title!=='string'||b.title.trim().length<3||b.title.length>100||
    typeof b.description!=='string'||b.description.length>500||
    b.referenceYear!==2025||typeof b.scenario?.author!=='string'||b.scenario.author.trim().length<2||b.scenario.author.length>60||!Array.isArray(b.measures)||b.measures.length>100||
    !b.scenario||typeof b.scenario!=='object'||Array.isArray(b.scenario)||
    !b.scenario.budget||!Array.isArray(b.scenario.picked)||b.scenario.picked.length>30)
    return reply(res,400,{error:'Budget invalide'});
  if(!b.measures.every((m:any)=>m&&typeof m.title==='string'&&m.title.length>0&&m.title.length<=160&&
    typeof m.description==='string'&&m.description.length<=2000&&
    typeof m.categoryCode==='string'&&(m.kind==='revenue'||m.kind==='expense')&&
    Number.isFinite(m.deltaAmount)&&Number.isFinite(m.referenceAmount)&&
    categories.get(m.kind+':'+m.categoryCode)===m.referenceAmount&&
    m.deltaAmount>=-m.referenceAmount&&m.deltaAmount<=m.referenceAmount))
    return reply(res,400,{error:'Mesures invalides'});
  // Une proposition citoyenne décrit une ou plusieurs affectations du pivot ;
  // aucun poste ne peut être revendiqué deux fois dans le même budget.
  const rawProposals=b.scenario.citizenMeasures??[];
  if(!Array.isArray(rawProposals)||rawProposals.length>100)
    return reply(res,400,{error:'Propositions invalides'});
  const baseByPost=new Map<string,number>([
    ...refs.map((x:any):[string,number]=>[x.side+':'+x.id,Number(x.amount)]),
    ...offBudget.map((x:any):[string,number]=>['offBudget:'+x.id,Number(x.amount)])
  ]);
  const assigned=new Set<string>();
  const expectedEntries=new Map<string,number>();
  for(const p of rawProposals){
    if(!p||typeof p.id!=='string'||!p.id||p.id.length>120||
       typeof p.title!=='string'||!p.title.trim()||p.title.length>160||
       typeof p.description!=='string'||!p.description.trim()||p.description.length>2000)
      return reply(res,400,{error:'Description de proposition invalide'});
    const impacts=Array.isArray(p.impacts)?p.impacts:
      (p.kind&&p.categoryId&&Number.isFinite(p.delta)?[{kind:p.kind,categoryId:p.categoryId,delta:p.delta}]:[]);
    if(!impacts.length||impacts.length>100)
      return reply(res,400,{error:'Impacts de proposition manquants'});
    for(const i of impacts){
      const key=i.kind+':'+i.categoryId;
      const reference=baseByPost.get(key);
      if(reference===undefined||assigned.has(key)||typeof i.categoryId!=='string'||
         !Number.isFinite(i.delta)||Math.abs(i.delta)<0.000001||
         i.delta < -reference || i.delta > reference)
        return reply(res,400,{error:'Poste invalide ou déjà affecté à une autre proposition'});
      assigned.add(key);
      const value=b.scenario.budget?.[i.kind]?.[i.categoryId]??reference;
      if(!Number.isFinite(value)||Math.abs(value-(reference+i.delta))>0.0011)
        return reply(res,400,{error:'Valeur budgétaire incohérente avec la proposition'});
      const measureKey=(i.kind==='expenses'?'expense:':'revenue:')+i.categoryId;
      expectedEntries.set(measureKey,i.kind==='offBudget'?-i.delta:i.delta);
    }
  }
  // Pour un nouveau budget citoyen de référence, aucune jauge modifiée
  // ne peut subsister hors d'une proposition.
  if(!b.scenario.aggregateOrigin&&!b.scenario.picked.length){
    for(const side of ['revenues','expenses','offBudget'] as const)
      for(const [id,value] of Object.entries(b.scenario.budget?.[side]??{})){
        const reference=baseByPost.get(side+':'+id);
        if(reference===undefined||typeof value!=='number'||!Number.isFinite(value)||
           (Math.abs(value-reference)>0.0011&&!assigned.has(side+':'+id)))
          return reply(res,400,{error:'Une modification du budget n’est liée à aucune proposition'});
      }
    if(b.measures.length!==assigned.size||
       !b.measures.every((m:any)=>{
         const key=m.kind+':'+m.categoryCode;
         return expectedEntries.has(key)&&Math.abs(Number(m.deltaAmount)-expectedEntries.get(key)!)<0.0011;
       }))return reply(res,400,{error:'Les mesures comptables ne correspondent pas aux propositions'});
  }
  const expected=categories;
  if(!b.scenario.budget.revenues||!b.scenario.budget.expenses||
    !['revenues','expenses','offBudget'].every(kind=>Object.entries(b.scenario.budget[kind]??{}).every(([id,value])=>{
      const base=expected.get((kind==='expenses'?'expense:':'revenue:')+id);
      return base!==undefined&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=base*2;
    })))return reply(res,400,{error:'Montants invalides'});
  // La reprise d'agrégats politiques doit être vérifiée côté serveur :
  // jamais de montants arbitraires injectés dans un budget citoyen.
  if(b.scenario.aggregateOrigin!=null){
    const sourceId=b.scenario.aggregateSourceId;
    if(typeof sourceId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceId)||
      !Array.isArray(b.scenario.aggregateIncludedIds)||
      !b.scenario.aggregateIncludedIds.every((id:any)=>typeof id==='string'))
      return reply(res,400,{error:'Référence du budget politique manquante ou invalide'});
    const check=await sql`SELECT EXISTS(
      SELECT 1 FROM budgets
      WHERE id=${sourceId}::uuid AND origin='party' AND visibility='public'
        AND scenario->'claimedTotals'=${JSON.stringify(b.scenario.aggregateOrigin)}::jsonb
        AND coalesce(scenario->'picked','[]'::jsonb)=${JSON.stringify(b.scenario.aggregateIncludedIds)}::jsonb
    ) AS valid`;
    if(!check[0]?.valid)return reply(res,400,{error:'Agrégats politiques non vérifiés'});
  }
  const canonical=JSON.stringify(b.scenario);
  if(canonical.length>25000)return reply(res,413,{error:'Budget trop volumineux'});
  const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  const fingerprint=createHash('sha256').update((process.env.DATABASE_URL||'')+':'+ip).digest('hex');
  const rows=await sql`SELECT public.publish_citizen_budget(${JSON.stringify({title:b.title.trim(),description:b.description,referenceYear:b.referenceYear,scenario:b.scenario,measures:b.measures})}::jsonb,${fingerprint}) AS id`;
  return reply(res,201,{id:rows[0].id});
 }catch(e){
  if(String(e).includes('publication_limit_reached'))return reply(res,409,{error:'Les 100 places sont occupées'});
  if(String(e).includes('publication_rate_limited'))return reply(res,429,{error:'Limite de 100 publications par 24 h atteinte'});
  return reply(res,500,{error:'Publication momentanément indisponible'});
 }
}
