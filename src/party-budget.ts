import {calculateScenario, type ReferenceModel, type Result, type Override, type SourcedEntry} from './projection-core';

export type PublishedAggregate = {
  year:number;
  basis:'delta'|'total';
  revenuesBn:number;
  expensesBn:number;
  balanceDeltaBn:number;
  sourceUrl:string;
  description?:string;
};
export type PartyBudgetInput = {
  origin:'party'|'citizen';
  scenario:{picked:string[];budget?:Override;claimedTotals?:PublishedAggregate};
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
  if(!claim) return calculateScenario(b.scenario.picked||[],b.scenario.budget||{revenues:{},expenses:{}},[],reference);
  const {year,basis,revenuesBn,expensesBn,balanceDeltaBn,sourceUrl}=claim;
  if(!Number.isInteger(year)||year<2000||year>2100||
      !['delta','total'].includes(basis)||
      ![revenuesBn,expensesBn,balanceDeltaBn].every(Number.isFinite)||
      !sourceUrl.startsWith('https://'))
    throw Error('Agrégats politiques invalides : métadonnées, année ou source');
  if((basis==='total'&&(revenuesBn<0||expensesBn<0))||
      (basis==='delta'&&(revenuesBn<0||expensesBn<0)))
    throw Error('Agrégats politiques invalides : montants négatifs');
  const baseRevenue=sum(reference.revenues),baseExpense=sum(reference.expenses);
  const deltaRevenue=basis==='delta'?revenuesBn:revenuesBn-baseRevenue;
  const deltaExpense=basis==='delta'?expensesBn:expensesBn-baseExpense;
  if(!close(deltaRevenue-deltaExpense,balanceDeltaBn))
    throw Error('Agrégats politiques non réconciliés : recettes - dépenses != solde');
  const entries:SourcedEntry[]=[
    {measureId:'aggregate:'+year+':revenues',side:'revenues',categoryId:adjustment('revenues',reference),
      amount:deltaRevenue,rationale:'Agrégat revendiqué par la formation, non ventilé : '+sourceUrl},
    {measureId:'aggregate:'+year+':expenses',side:'expenses',categoryId:adjustment('expenses',reference),
      amount:deltaExpense,rationale:'Agrégat revendiqué par la formation, non ventilé : '+sourceUrl},
  ];
  // Never sum individual selections on top of the complete announced totals.
  const result=calculateScenario([],{revenues:{},expenses:{}},entries,reference);
  return {...result,warnings:[...result.warnings,
    'Résultat global revendiqué par la formation ('+year+'), source : '+sourceUrl+
    '. Les mesures détaillées sont documentaires et ne sont pas additionnées aux agrégats.',
    'Ventilation des agrégats dans les catégories techniques de rapprochement : ce ne sont pas des postes de dépense ou recette supplémentaires.']};
}

export const aggregateMode=(b:PartyBudgetInput)=>b.origin==='party'&&Boolean(b.scenario.claimedTotals);
