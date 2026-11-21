import type {ProjectionResult} from './simulation';
import type {QualificationTone} from './qualification';

export type ProjectionVerdict={
  label:'Redressement'|'Amélioration relative'|'Dégradation'|'Non qualifié';
  tone:QualificationTone;
  title:string;
};

/**
 * Public budget verdict: 2032 gap to the reference first, then the
 * sustained post-application trajectory. It is not an economic forecast.
 */
export function projectionVerdict(projection:ProjectionResult):ProjectionVerdict {
  const rows=projection.rows;
  if(rows.length<2||rows.some(r=>!Number.isFinite(r.reference)||!Number.isFinite(r.scenario))){
    return {label:'Non qualifié',tone:'neutral',title:'Trajectoire non qualifiable'};
  }
  const end=rows[rows.length-1];
  const post=rows.filter(r=>r.year>=projection.assumptions.applicationYear);
  if(post.length<2)return {label:'Non qualifié',tone:'neutral',title:'Trajectoire non qualifiable'};
  // Data is displayed rounded to one decimal: do not infer sub-0.1 Md€ gaps.
  const tolerance=projection.assumptions.assessment?.changeThreshold??0.1;
  const gap=end.reference-end.scenario; // positive = less deficit than reference
  const rise=post[post.length-1].scenario-post[0].scenario;
  if(gap< -tolerance || (Math.abs(gap)<=tolerance && rise>tolerance))
    return {label:'Dégradation',tone:'negative',title:'Trajectoire du déficit en dégradation'};
  // Reaching balance or a surplus in 2032 is redressement regardless of
  // the post-2027 slope: a deficit can rise toward zero from a surplus.
  // Keep the reference comparison first: never praise a worse scenario.
  const balanceTolerance=projection.assumptions.assessment?.balanceThreshold??0.05;
  if(gap>tolerance && end.scenario<=balanceTolerance)
    return {label:'Redressement',tone:'positive',title:'Déficit résorbé ou budget excédentaire en 2032'};
  if(gap>tolerance && rise>tolerance)
    return {label:'Amélioration relative',tone:'warning',title:'Déficit moindre que la référence, mais toujours en hausse'};
  if(gap>tolerance && rise<=tolerance)
    return {label:'Redressement',tone:'positive',title:'Déficit moindre que la référence et stabilisé ou en baisse'};
  return {label:'Non qualifié',tone:'neutral',title:'Trajectoire sans écart significatif à la référence'};
}
