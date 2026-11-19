import type {Override,Result,Side} from '../projection';
type GaugeKind=Side|'offBudget';

// Display the *effective* accounting result, including political measures and manual changes.
export function gaugeAmount(result:Result,kind:GaugeKind,id:string):number {
 return result[kind][id];
}

// Adjust a manual override to reach a requested *effective* line amount.
// Political measures must remain applied exactly once (and never disappear from the gauge).
export function gaugeOverride(
  kind:GaugeKind,id:string,desiredEffectiveAmount:number,referenceAmount:number,
  currentOverride:Override,currentResult:Result,
):number {
 const previousOverride=currentOverride[kind]?.[id]??referenceAmount;
 const currentEffective=gaugeAmount(currentResult,kind,id);
 return Math.round((previousOverride+desiredEffectiveAmount-currentEffective)*100)/100;
}
