export type QualificationCode =
  | 'SURPLUS_REACHED' | 'BALANCE_REACHED' | 'DEFICIT_RETURNED'
  | 'SURPLUS_TO_BALANCE' | 'BALANCE_STABLE' | 'SURPLUS_STABLE'
  | 'DEFICIT_DECREASING' | 'INCREASE_DECELERATING'
  | 'DEFICIT_STABLE' | 'INCREASE_STEADY' | 'INCREASE_ACCELERATING'
  | 'UNDETERMINED';
export type Direction='increasing'|'stable'|'decreasing';
export type Momentum='accelerating'|'steady'|'decelerating';
export interface Assessment {
  code: QualificationCode;
  direction: Direction;
  momentum: Momentum;
}
export interface YearlyDeficit {year:number;deficit:number}
export interface AssessmentService {
  assess(rows: ReadonlyArray<YearlyDeficit>): Assessment;
}

// Md€ tolerance prevents tiny numerical differences from changing the public label.
export const BALANCE_THRESHOLD=0.05;
export const CHANGE_THRESHOLD=0.10;
export const MOMENTUM_THRESHOLD=0.50;
const sign=(n:number)=>n>BALANCE_THRESHOLD?'deficit':n< -BALANCE_THRESHOLD?'surplus':'balance';
const cmp=(n:number,t:number):Direction=>n>t?'increasing':n< -t?'decreasing':'stable';
export const assessmentService: AssessmentService={
 assess(rows) {
  const fallback:Assessment={code:'UNDETERMINED',direction:'stable',momentum:'steady'};
  if(rows.length<2||rows.some((r,i)=>!Number.isFinite(r.deficit)||!Number.isFinite(r.year)||(i>0&&r.year<=rows[i-1].year)))return fallback;
  const first=rows[0].deficit,last=rows[rows.length-1].deficit;
  // Exclude the one-time activation jump (2025→2026) from direction and momentum.
  // A lower final deficit than in 2025 is not a sustained decrease if it rises after 2026.
  const afterActivation=rows.length>=3?rows.slice(1):rows;
  const direction=cmp(last-afterActivation[0].deficit,CHANGE_THRESHOLD);
  // Analyse at least THREE subsequent annual differences before inferring curvature.
  const slopes=afterActivation.slice(1).map((r,i)=>(r.deficit-afterActivation[i].deficit)/(r.year-afterActivation[i].year));
  let momentum:Momentum='steady';
  if(slopes.length>=3){
    const delta=slopes.slice(1).map((s,i)=>s-slopes[i]);
    const mean=delta.reduce((a,b)=>a+b,0)/delta.length;
    if(delta.every(v=>v>MOMENTUM_THRESHOLD)&&mean>MOMENTUM_THRESHOLD)momentum='accelerating';
    if(delta.every(v=>v< -MOMENTUM_THRESHOLD)&&mean< -MOMENTUM_THRESHOLD)momentum='decelerating';
  }
  let code:QualificationCode;
  const initial=sign(first),final=sign(last);
  if(final==='surplus')code=initial==='surplus'?'SURPLUS_STABLE':'SURPLUS_REACHED';
  else if(final==='balance')code=initial==='balance'?'BALANCE_STABLE':initial==='surplus'?'SURPLUS_TO_BALANCE':'BALANCE_REACHED';
  else if(initial!=='deficit')code='DEFICIT_RETURNED';
  else if(direction==='decreasing')code='DEFICIT_DECREASING';
  else if(direction==='stable')code='DEFICIT_STABLE';
  else if(momentum==='decelerating')code='INCREASE_DECELERATING';
  else if(momentum==='accelerating')code='INCREASE_ACCELERATING';
  else code='INCREASE_STEADY';
  return {code,direction,momentum};
 }
};
