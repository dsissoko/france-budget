import type {ProjectionResult,ProjectionYear} from '../engine/simulation';

export type SlopePoint={year:number;value:number;x:number;y:number};
export type SlopeSeries={id:'reference'|'a'|'b';points:SlopePoint[];ending:number};
export interface SlopeGraphData {
 series:SlopeSeries[];
 min:number;
 max:number;
 reference2032:number;
 deltas:{a:number|null;b:number|null};
 startYear:number;
 endYear:number;
 applicationYear:number;
}
// Shared, zero-side-effect geometry for the single-budget and A/B charts.
// All series share exactly the same axis; close values remain close.
export function buildSlopeGraph(primary:ProjectionResult,secondary?:ProjectionResult,referenceOnly=false):SlopeGraphData{
 const startYear=primary.assumptions.referenceYear;
 const endYear=primary.assumptions.horizonYear;
 const applicationYear=primary.assumptions.applicationYear;
 const selectedYears=[startYear,applicationYear-1,applicationYear,endYear]
  .filter((y,i,list)=>y>=startYear&&y<=endYear&&list.indexOf(y)===i);
 const yearMap=new Map(primary.rows.map(row=>[row.year,row]));
 const otherMap=secondary?new Map(secondary.rows.map(row=>[row.year,row])):null;
 const selected=selectedYears.map(year=>{
  const row=yearMap.get(year);
  if(!row)throw new Error('Projection missing required year '+year);
  return row;
 });
 if(otherMap&&selectedYears.some(year=>!otherMap.has(year)))throw new Error('Comparison has mismatched years');
 const candidates=[
  ...selected.map(r=>r.reference),
  ...(referenceOnly?[]:selected.map(r=>r.scenario)),
  ...(otherMap?selectedYears.map(year=>otherMap.get(year)!.scenario):[]),
 ];
 if(candidates.some(value=>!Number.isFinite(value)))throw new Error('Projection contains invalid amounts');
 const rawMin=Math.min(...candidates),rawMax=Math.max(...candidates);
 const spread=Math.max(rawMax-rawMin,12);
 const pad=spread*.16;
 const min=(rawMin+rawMax)/2-spread/2-pad;
 const max=(rawMin+rawMax)/2+spread/2+pad;
 const x=(year:number)=>28+(year-startYear)/(endYear-startYear)*304;
 const y=(value:number)=>14+(max-value)/(max-min)*108;
 const refEnd=yearMap.get(endYear)!.reference;
 const build=(id:SlopeSeries['id'],value:(year:number,row:ProjectionYear)=>number):SlopeSeries=>{
  const points=selected.map(row=>({year:row.year,value:value(row.year,row),x:x(row.year),y:y(value(row.year,row))}));
  return {id,points,ending:points[points.length-1].value};
 };
 const series=[build('reference',(_year,row)=>row.reference)];
 if(!referenceOnly)series.push(build('a',(_year,row)=>row.scenario));
 if(otherMap)series.push(build('b',(year)=>otherMap.get(year)!.scenario));
 return {
  series,min,max,reference2032:refEnd,
  deltas:{
   a:referenceOnly?null:refEnd-yearMap.get(endYear)!.scenario,
   b:otherMap?refEnd-otherMap.get(endYear)!.scenario:null,
  },
  startYear,endYear,applicationYear,
 };
}
