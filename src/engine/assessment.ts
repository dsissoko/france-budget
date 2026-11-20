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
  assess(rows: ReadonlyArray<YearlyDeficit>,applicationYear?:number,thresholds?:AssessmentThresholds): Assessment;
}

// Md€ tolerance prevents tiny numerical differences from changing the public label.
export const BALANCE_THRESHOLD=0.05;
export const CHANGE_THRESHOLD=0.10;
export const MOMENTUM_THRESHOLD=0.50;
export type AssessmentThresholds={balanceThreshold:number;changeThreshold:number;momentumThreshold:number};
export const DEFAULT_THRESHOLDS:AssessmentThresholds={balanceThreshold:BALANCE_THRESHOLD,changeThreshold:CHANGE_THRESHOLD,momentumThreshold:MOMENTUM_THRESHOLD};
const sign=(n:number,t:number)=>n>t?'deficit':n< -t?'surplus':'balance';
const cmp=(n:number,t:number):Direction=>n>t?'increasing':n< -t?'decreasing':'stable';
export const assessmentService: AssessmentService={
 assess(rows,applicationYear=rows[1]?.year,thresholds=DEFAULT_THRESHOLDS) {
  const fallback:Assessment={code:'UNDETERMINED',direction:'stable',momentum:'steady'};
  if(rows.length<2||rows.some((r,i)=>!Number.isFinite(r.deficit)||!Number.isFinite(r.year)||(i>0&&r.year<=rows[i-1].year)))return fallback;
  const first=rows[0].deficit,last=rows[rows.length-1].deficit;
  // Exclude every pre-application year and the first policy activation jump.
  // Analyse only the sustained trajectory from the application year onward.
  const afterActivation=rows.filter(row=>row.year>=applicationYear);
  if(afterActivation.length<2)return fallback;
  const direction=cmp(afterActivation[afterActivation.length-1].deficit-afterActivation[0].deficit,thresholds.changeThreshold);
  // Analyse at least THREE subsequent annual differences before inferring curvature.
  const slopes=afterActivation.slice(1).map((r,i)=>(r.deficit-afterActivation[i].deficit)/(r.year-afterActivation[i].year));
  let momentum:Momentum='steady';
  if(slopes.length>=3){
    const delta=slopes.slice(1).map((s,i)=>s-slopes[i]);
    const mean=delta.reduce((a,b)=>a+b,0)/delta.length;
    if(delta.every(v=>v>thresholds.momentumThreshold)&&mean>thresholds.momentumThreshold)momentum='accelerating';
    if(delta.every(v=>v< -thresholds.momentumThreshold)&&mean< -thresholds.momentumThreshold)momentum='decelerating';
  }
  let code:QualificationCode;
  const initial=sign(first,thresholds.balanceThreshold),final=sign(last,thresholds.balanceThreshold);
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
