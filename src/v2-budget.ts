import type {ReferenceModel,Result,SourcedEntry} from './projection-core';
import {calculateScenario} from './projection-core';
import type {PublishedAggregate} from './party-budget';

export type BudgetSide='revenues'|'expenses'|'offBudget';
export type BudgetImpact={side:BudgetSide;categoryId:string;deltaAmountBn:number};
export type BudgetProposal={
 proposalKey:string;title:string;description:string;
 impacts:BudgetImpact[];sourceUrl?:string|null;claimedAmountBn?:string|null;
};
export type BudgetMode='PARTIAL'|'AGGREGATE';
export type BudgetDocumentary={
 sources?:Array<{source_url?:string;sourceUrl?:string;title?:string}>;
 aggregates?:Array<{basis?:'delta'|'total';year?:number;revenues_bn?:string|number;expenses_bn?:string|number;balance_delta_bn?:string|number;source_url?:string;scope?:string}>;
 citizenSource?:{budgetKey:string;title:string;budgetMode?:BudgetMode;
   aggregate?:BudgetDocumentary['aggregates'] extends Array<infer T>?T|null:never;
   proposals?:BudgetProposal[]};
};
export type PublishedBudget={
 id:string;budgetKey:string;version:string;origin:'party'|'citizen'|'educational';
 partyCode?:string|null;title:string;description:string;author?:string|null;
 budgetMode:BudgetMode;documentary:BudgetDocumentary;proposals:BudgetProposal[];
 referenceYear:number;sourceYear?:number|null;published_at?:string|null;votes:number;
 featured:boolean;featured_order:number|null;maturity_status?:string|null;
 confirmation_organization?:string|null;confirmation_evidence_url?:string|null;confirmed_at?:string|null;
 revision?:number;
};
export type CitizenBudgetDraft={
 proposals:BudgetProposal[];
 revenues:Record<string,number>;expenses:Record<string,number>;offBudget:Record<string,number>;
 source?:{budgetKey:string;title:string;aggregate?:PublishedAggregate};
};
export const emptyBudgetOverrides=()=>({revenues:{},expenses:{},offBudget:{}});

export const eligibleForDisplay=(b:PublishedBudget)=>b.origin==='citizen'||b.budgetMode==='AGGREGATE'||b.proposals.some(p=>p.impacts.length>0);
export const measuredProposals=(b:PublishedBudget)=>b.proposals.filter(p=>p.impacts.some(i=>Number(i.deltaAmountBn)!==0));

export function reportedAggregate(b:Pick<PublishedBudget,'documentary'|'budgetMode'>):PublishedAggregate|null{
 if(b.budgetMode!=='AGGREGATE')return null;
 const a=b.documentary?.aggregates?.find(x=>Number.isFinite(Number(x.revenues_bn))&&Number.isFinite(Number(x.expenses_bn))&&x.source_url?.startsWith('https://'));
 if(!a)return null;
 return {year:Number(a.year??2027),basis:a.basis??'delta',
   revenuesBn:Number(a.revenues_bn),expensesBn:Number(a.expenses_bn),
   balanceDeltaBn:a.balance_delta_bn===undefined?undefined:Number(a.balance_delta_bn),
   sourceUrl:String(a.source_url),scope:a.scope};
}
export function proposalEntries(proposals:ReadonlyArray<BudgetProposal>):SourcedEntry[]{
 return proposals.flatMap(p=>p.impacts.map(i=>({
   measureId:'v2:'+p.proposalKey,side:i.side,categoryId:i.categoryId,
   amount:Number(i.deltaAmountBn),rationale:p.description||'Impact qualifié du budget'
 })));
}
export function computeBudget(b:PublishedBudget,reference:ReferenceModel):Result{
 const source=b.documentary?.citizenSource;
 if(b.origin==='citizen'&&source){
   const base:PublishedBudget={...b,origin:'party',budgetMode:source.budgetMode??'PARTIAL',
      documentary:{aggregates:source.aggregate?[source.aggregate]:[]},
      proposals:source.proposals??[]};
   const baseResult=computeBudget(base,reference);
   const baseline=calculateScenario([],emptyBudgetOverrides(),[],reference);
   const additions=calculateScenario([],emptyBudgetOverrides(),proposalEntries(b.proposals),reference);
   const merge=(first:Record<string,number>,added:Record<string,number>,original:Record<string,number>)=>
    Object.fromEntries(Object.entries(first).map(([key,value])=>[key,value+(added[key]??0)-(original[key]??0)]));
   const revenues=merge(baseResult.revenues,additions.revenues,baseline.revenues);
   const expenses=merge(baseResult.expenses,additions.expenses,baseline.expenses);
   const offBudget=merge(baseResult.offBudget,additions.offBudget,baseline.offBudget);
   const round=(v:number)=>Math.round(v*100)/100;
   const revenueTotal=round(Object.values(revenues).reduce((a,b)=>a+b,0));
   const expenseTotal=round(Object.values(expenses).reduce((a,b)=>a+b,0));
   return {entries:[...baseResult.entries,...additions.entries],revenues,expenses,offBudget,
      revenueTotal,expenseTotal,deficit:round(expenseTotal-revenueTotal),
      balanceDelta:round(baseline.deficit-(expenseTotal-revenueTotal)),
      warnings:[...baseResult.warnings,...additions.warnings]};
 }
 const aggregate=reportedAggregate(b);
 if(aggregate){
   const baseRevenue=reference.revenues.reduce((n,r)=>n+r.amount,0);
   const baseExpense=reference.expenses.reduce((n,r)=>n+r.amount,0);
   const additions:SourcedEntry[]=[
    {measureId:'aggregate:revenues',side:'revenues',categoryId:'other',
      amount:aggregate.basis==='delta'?aggregate.revenuesBn:aggregate.revenuesBn-baseRevenue,
      rationale:'Agrégat financier revendiqué, sans ventilation : '+aggregate.sourceUrl},
    {measureId:'aggregate:expenses',side:'expenses',categoryId:'other-expenses',
      amount:aggregate.basis==='delta'?aggregate.expensesBn:aggregate.expensesBn-baseExpense,
      rationale:'Agrégat financier revendiqué, sans ventilation : '+aggregate.sourceUrl}
   ];
   const r=calculateScenario([],emptyBudgetOverrides(),additions,reference);
   return {...r,warnings:[...r.warnings,'Agrégat déclaré : les propositions documentaires ne sont pas ajoutées aux masses.']};
 }
 return calculateScenario([],emptyBudgetOverrides(),proposalEntries(b.proposals),reference);
}

/** A citizen starts from an existing published budget without replaying its impacts.
 * Only local edits relative to the selected base are applied to the computed result.
 */
export function computeCitizenDraft(
 reference:ReferenceModel,
 proposals:ReadonlyArray<BudgetProposal>,
 source:PublishedBudget|null=null,
):Result{
 const base=source?computeBudget(source,reference):calculateScenario([],emptyBudgetOverrides(),[],reference);
 const baseline=calculateScenario([],emptyBudgetOverrides(),[],reference);
 const edits=calculateScenario([],emptyBudgetOverrides(),proposalEntries(proposals),reference);
 const merge=(original:Record<string,number>,delta:Record<string,number>,baselineValues:Record<string,number>)=>
   Object.fromEntries(Object.entries(original).map(([id,v])=>[id,v+(delta[id]??0)-(baselineValues[id]??0)]));
 const revenues=merge(base.revenues,edits.revenues,baseline.revenues);
 const expenses=merge(base.expenses,edits.expenses,baseline.expenses);
 const offBudget=merge(base.offBudget,edits.offBudget,baseline.offBudget);
 const round=(v:number)=>Math.round(v*100)/100;
 const revenueTotal=round(Object.values(revenues).reduce((a,b)=>a+b,0));
 const expenseTotal=round(Object.values(expenses).reduce((a,b)=>a+b,0));
 return {entries:edits.entries,revenues,expenses,offBudget,revenueTotal,expenseTotal,
   deficit:round(expenseTotal-revenueTotal),
   balanceDelta:round(baseline.deficit-(expenseTotal-revenueTotal)),
   warnings:[...base.warnings,...edits.warnings]};
}
export const availablePost=(side:BudgetSide,categoryId:string,proposals:BudgetProposal[],excludeKey:string|null)=>
 !proposals.some(p=>p.proposalKey!==excludeKey&&p.impacts.some(i=>i.side===side&&i.categoryId===categoryId));
export const validExclusiveProposals=(proposals:BudgetProposal[]):boolean=>{
 const seen=new Set<string>();
 for(const p of proposals)for(const i of p.impacts){
   const k=i.side+':'+i.categoryId;if(seen.has(k))return false;seen.add(k);
 }
 return true;
};
export function updateImpact(impacts:BudgetImpact[],side:BudgetSide,categoryId:string,deltaAmountBn:number):BudgetImpact[]{
 return [...impacts.filter(i=>i.side!==side||i.categoryId!==categoryId),
  ...(Math.abs(deltaAmountBn)>0.000001?[{side,categoryId,deltaAmountBn:Math.round(deltaAmountBn*1000)/1000}]:[])];
}
export function readDraftProposals(value:unknown):BudgetProposal[]{
 if(!Array.isArray(value))return [];
 return value.flatMap((x:any)=>{
   const proposalKey=typeof x?.proposalKey==='string'?x.proposalKey:typeof x?.id==='string'?x.id:'';
   if(!proposalKey)return [];
   const impacts=Array.isArray(x.impacts)?x.impacts.flatMap((i:any)=>{
     const side=i?.side??i?.kind,categoryId=i?.categoryId;
     const amount=Number(i?.deltaAmountBn??i?.delta);
     return ['revenues','expenses','offBudget'].includes(side)&&typeof categoryId==='string'&&Number.isFinite(amount)&&Math.abs(amount)>0.000001?
      [{side:side as BudgetSide,categoryId,deltaAmountBn:amount}]:[];
   }):[];
   return [{proposalKey,title:String(x.title??''),description:String(x.description??''),impacts,
     sourceUrl:typeof x.sourceUrl==='string'?x.sourceUrl:null}];
 });
}
