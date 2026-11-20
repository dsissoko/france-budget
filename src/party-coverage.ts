export type Claim={year:number;revenuesBn:number;expensesBn:number;balanceDeltaBn:number;sourceUrl:string};
export type DocumentaryLine={id:number;accountingMeasureId?:string|null};
export type DocumentaryGroup={year:number;sourceLines?:DocumentaryLine[]};
export type CoverageBudget={origin:string;scenario:{picked:string[];claimedTotals?:Claim};documentaryProposals?:DocumentaryGroup[]};

/** Independent of political party: do not classify a whole programme from a partial selection. */
export function budgetCoverage(b:CoverageBudget): {incomplete:boolean;total:number;calculated:number;claim?:Claim} {
 if(b.origin!=='party')return {incomplete:false,total:0,calculated:0};
 const groups=b.documentaryProposals||[];
 const year=b.scenario.claimedTotals?.year??Math.max(0,...groups.map(g=>g.year));
 const lines=groups.filter(g=>g.year===year).flatMap(g=>g.sourceLines||[]);
 const selected=new Set(b.scenario.picked||[]);
 const calculated=lines.filter(l=>!!l.accountingMeasureId&&selected.has(l.accountingMeasureId)).length;
 return {incomplete:lines.length>calculated,total:lines.length,calculated,claim:b.scenario.claimedTotals};
}
