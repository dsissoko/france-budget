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
    if(b.budgetMode==='AGGREGATE'){
      const allocations=b.documentary?.claimedAllocations;
      if(!Array.isArray(allocations)||!allocations.length)
        return respond(res,200,{budgetKey:b.budgetKey,version:b.version,budgetMode:'AGGREGATE',
          accountingStatus:'documentary_aggregate_only',declaredAggregates:b.documentary?.aggregates??[],
          positions:[]});
      const posts=await sql`SELECT side,category_id AS "categoryId",label,
        reference_amount_bn::text AS "referenceAmountBn"
        FROM v2.reference_posts WHERE reference_year=${b.referenceYear}
        ORDER BY side,sort_order,category_id`;
      const agg=(b.documentary?.aggregates??[]).find((a:any)=>
        Number.isFinite(Number(a.revenues_bn))&&Number.isFinite(Number(a.expenses_bn)));
      if(!agg)throw Error('Missing aggregate for validated allocations');
      const baseRevenue=posts.filter((p:any)=>p.side==='revenues')
        .reduce((n:number,p:any)=>n+Number(p.referenceAmountBn),0);
      const baseExpense=posts.filter((p:any)=>p.side==='expenses')
        .reduce((n:number,p:any)=>n+Number(p.referenceAmountBn),0);
      const claimed={revenues:agg.basis==='total'?Number(agg.revenues_bn)-baseRevenue:Number(agg.revenues_bn),
        expenses:agg.basis==='total'?Number(agg.expenses_bn)-baseExpense:Number(agg.expenses_bn)};
      const applied=new Map<string,number>(),sum={revenues:0,expenses:0};
      for(const a of allocations){
        const side=a.side,categoryId=a.categoryId,amount=Number(a.amount);
        const key=side+':'+categoryId;
        if(!['revenues','expenses'].includes(side)||!Number.isFinite(amount)||
           !posts.some((p:any)=>p.side===side&&p.categoryId===categoryId)||
           applied.has(key)||['revenues:other','expenses:other-expenses'].includes(key))
          throw Error('Invalid aggregate allocation '+key);
        applied.set(key,amount);
        sum[side as 'revenues'|'expenses']+=amount;
      }
      const remainder={revenues:claimed.revenues-sum.revenues,
        expenses:claimed.expenses-sum.expenses};
      if(remainder.revenues<-.011||remainder.expenses<-.011)
        throw Error('Allocated amounts exceed the declared aggregates');
      applied.set('revenues:other',remainder.revenues);
      applied.set('expenses:other-expenses',remainder.expenses);
      const positions=posts.map((p:any)=>{
        const delta=applied.get(p.side+':'+p.categoryId)??0;
        const reference=Number(p.referenceAmountBn);
        return {side:p.side,categoryId:p.categoryId,label:p.label,
          referenceAmountBn:reference.toFixed(3),deltaAmountBn:delta.toFixed(3),
          resultAmountBn:(reference+delta).toFixed(3)};
      });
      return respond(res,200,{budgetKey:b.budgetKey,version:b.version,
        budgetMode:'AGGREGATE',accountingStatus:'aggregate_allocated',
        declaredAggregates:b.documentary.aggregates??[],positions});
    }
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
