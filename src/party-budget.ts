import {calculateScenario, type ReferenceModel, type Result, type Override, type SourcedEntry} from './projection-core';

export type PublishedAggregate = {
  year:number;
  basis:'delta'|'total';
  revenuesBn:number;
  expensesBn:number;
  balanceDeltaBn?:number;
  sourceUrl:string;
  description?:string;
  scope?:string;
  sourceSection?:string;
  reportedOverallBalanceDeltaBn?:number;
  overallExplanation?:string;
};
export type ClaimedAllocation = {side:'revenues'|'expenses';categoryId:string;amount:number};
export type PartyBudgetInput = {
  origin:'party'|'citizen';
  scenario:{picked:string[];budget?:Override;claimedTotals?:PublishedAggregate;claimedAllocations?:ClaimedAllocation[]};
};

const sum=(a:readonly {amount:number}[])=>a.reduce((n,x)=>n+x.amount,0);
const close=(a:number,b:number)=>Math.abs(a-b)<0.011;
const adjustment=(side:'revenues'|'expenses',reference:ReferenceModel)=>{
  const values=side==='revenues'?reference.revenues:reference.expenses;
  const marker=side==='revenues'?'other':'other-expenses';
  if(!values.some(v=>v.id===marker))throw Error('Catégorie de rapprochement APU absente : '+side);
  return marker;
};

/**
 * A party's sourced, reconciled top-level aggregates have priority over its
 * individual measures. Aggregates are reported claims, not independent forecasts.
 * A partial catalogue uses the normal INSEE + individually selected deltas engine.
 */
export function calculatePublishedBudget(b:PartyBudgetInput,reference:ReferenceModel):Result {
  const claim=b.origin==='party'?b.scenario.claimedTotals:undefined;
  // Only a pair of numeric masses selects AGGREGATE; a lone announced figure remains PARTIAL.
  if(!claim || !Number.isFinite(claim.revenuesBn) || !Number.isFinite(claim.expensesBn))
    return calculateScenario(b.scenario.picked||[],b.scenario.budget||{revenues:{},expenses:{}},[],reference);
  const {year,basis,revenuesBn,expensesBn,balanceDeltaBn,sourceUrl}=claim;
  if(!Number.isInteger(year)||year<2000||year>2100||
      !['delta','total'].includes(basis)||
      ![revenuesBn,expensesBn].every(Number.isFinite)||
      !sourceUrl.startsWith('https://'))
    throw Error('Agrégats politiques invalides : métadonnées, année ou source');
  if(basis==='total'&&(revenuesBn<0||expensesBn<0))
    throw Error('Agrégats politiques invalides : montants négatifs');
  const baseRevenue=sum(reference.revenues),baseExpense=sum(reference.expenses);
  const deltaRevenue=basis==='delta'?revenuesBn:revenuesBn-baseRevenue;
  const deltaExpense=basis==='delta'?expensesBn:expensesBn-baseExpense;
  if(balanceDeltaBn!==undefined && (!Number.isFinite(balanceDeltaBn)||!close(deltaRevenue-deltaExpense,balanceDeltaBn)))
    throw Error('Agrégats politiques non réconciliés : recettes - dépenses != solde');
  // CSV-based allocations redistribute the announced masses across citizen posts.
  // The remaining, unallocatable part stays on the existing adjustment categories.
  // This never adds amounts to the party's published totals.
  const allocations=b.scenario.claimedAllocations??[];
  const seen=new Set<string>();
  const allocationSums={revenues:0,expenses:0};
  const entries:SourcedEntry[]=[];
  for(const allocation of allocations){
    const {side,categoryId,amount}=allocation;
    const categories=side==='revenues'?reference.revenues:side==='expenses'?reference.expenses:null;
    const key=side+':'+categoryId;
    if(!categories?.some(c=>c.id===categoryId)||categoryId===adjustment(side,reference)||
       !Number.isFinite(amount)||Math.sign(amount)!==Math.sign(side==='revenues'?deltaRevenue:deltaExpense)||
       seen.has(key))throw Error('Ventilation politique invalide : '+key);
    seen.add(key);
    allocationSums[side]+=amount;
    entries.push({measureId:'aggregate:'+year+':post:'+key,side,categoryId,amount,
      rationale:'Ventilation de l’agrégat revendiqué par la formation, non ajoutée au total : '+sourceUrl});
  }
  const remainder={revenues:deltaRevenue-allocationSums.revenues,expenses:deltaExpense-allocationSums.expenses};
  if((deltaRevenue>=0&&remainder.revenues < -0.011)||(deltaRevenue<0&&remainder.revenues>0.011)||
     (deltaExpense>=0&&remainder.expenses < -0.011)||(deltaExpense<0&&remainder.expenses>0.011))
    throw Error('Ventilation politique supérieure aux agrégats revendiqués');
  for(const side of ['revenues','expenses'] as const){
    if(Math.abs(remainder[side])<0.001)continue;
    entries.push({measureId:'aggregate:'+year+':reliquat:'+side,side,
      categoryId:adjustment(side,reference),amount:remainder[side],
      rationale:'Part non ventilée de l’agrégat revendiqué : '+sourceUrl});
  }
  // The third number is optional: the resulting balance is inferred from the two sourced masses.
  // Never sum individual selections on top of the complete announced totals.
  const result=calculateScenario([],{revenues:{},expenses:{}},entries,reference);
  return {...result,warnings:[...result.warnings,
    'Résultat global revendiqué par la formation ('+year+'), source : '+sourceUrl+
    '. Les mesures détaillées sont documentaires et ne sont pas additionnées aux agrégats.',
    'Les montants attribuables sont répartis dans les postes citoyens ; seul le reliquat non ventilé reste en ajustement. Aucun montant supplémentaire n’est créé.']};
}

export const aggregateMode=(b:PartyBudgetInput)=>b.origin==='party'&&Number.isFinite(b.scenario.claimedTotals?.revenuesBn)&&Number.isFinite(b.scenario.claimedTotals?.expensesBn);


/**
 * Reprise citoyenne d'un AGGREGATE : les montants revendiqués forment la base.
 * Les mesures originelles du parti sont déjà comprises dans cette base et ne
 * sont donc jamais rejouées. Seuls les ajouts citoyens sont des deltas.
 */
export function calculateAggregateCitizenBudget(
  claim:PublishedAggregate,
  newMeasureIds:string[],
  citizen:Override,
  reference:ReferenceModel,
  alreadyIncludedIds:ReadonlyArray<string>=[],
):Result {
  const base=calculatePublishedBudget({origin:'party',scenario:{picked:[],claimedTotals:claim}},reference);
  const initial=calculateScenario([],{revenues:{},expenses:{}},[],reference);
  const included=new Set(alreadyIncludedIds);
  const additions=calculateScenario(newMeasureIds.filter(id=>!included.has(id)),citizen,[],reference);
  const merge=(baseValues:Record<string,number>,added:Record<string,number>,original:Record<string,number>)=>
    Object.fromEntries(Object.entries(baseValues).map(([id,value])=>[id,value+(added[id]??0)-(original[id]??0)]));
  const revenues=merge(base.revenues,additions.revenues,initial.revenues);
  const expenses=merge(base.expenses,additions.expenses,initial.expenses);
  const offBudget=merge(base.offBudget,additions.offBudget,initial.offBudget);
  const revenueTotal=Math.round(Object.values(revenues).reduce((a,b)=>a+b,0)*100)/100;
  const expenseTotal=Math.round(Object.values(expenses).reduce((a,b)=>a+b,0)*100)/100;
  return {
    revenues,expenses,offBudget,revenueTotal,expenseTotal,
    deficit:Math.round((expenseTotal-revenueTotal)*100)/100,
    balanceDelta:Math.round((initial.deficit-(expenseTotal-revenueTotal))*100)/100,
    entries:[...base.entries,...additions.entries],
    warnings:[...base.warnings,...additions.warnings],
  };
}
