import {assessmentService,type Assessment} from './assessment';
import {impactService,type ImpactService} from './impact';

// One shared calendar for every annual projection. All rates remain V1 mechanical assumptions.
export const PROJECTION_CALENDAR={
 referenceYear:2025,
 budgetYear:2027,
 applicationYear:2027,
 horizonYear:2032,
} as const;
export const projectionYears=Array.from(
 {length:PROJECTION_CALENDAR.horizonYear-PROJECTION_CALENDAR.referenceYear+1},
 (_,i)=>PROJECTION_CALENDAR.referenceYear+i,
);
export const V1_ASSUMPTIONS={
 baselineRatePerIndex:0.025,
 ...PROJECTION_CALENDAR,
} as const;
export type SimulationParameters={referenceYear:number;budgetYear:number;applicationYear:number;horizonYear:number;baselineRatePerIndex:number};
export const yearsFor=(p:SimulationParameters)=>Array.from({length:p.horizonYear-p.referenceYear+1},(_,i)=>p.referenceYear+i);
export interface ProjectionYear {year:number;reference:number;scenario:number}
export interface ProjectionResult {
 modelId:string;
 assumptions:SimulationParameters;
 rows:ProjectionYear[];
 assessment:Assessment;
 warnings:string[];
}
export interface SimulationService {
 simulate(baseDeficit:number,balanceDelta:number,years:ReadonlyArray<number>,parameters?:SimulationParameters):ProjectionResult;
}
const round=(n:number)=>Math.round(n*10)/10;
export function createSimulationService(impacts:ImpactService=impactService):SimulationService {
 return {
  simulate(baseDeficit,balanceDelta,years,parameters=V1_ASSUMPTIONS) {
   const rows=years.map(year=>{
    // Anchor the reference to 2025, not to the first requested display index.
    const unroundedReference=baseDeficit*(1+parameters.baselineRatePerIndex*(year-parameters.referenceYear));
    const reference=round(unroundedReference);
    const scenarioBeforeImpact=unroundedReference-(year<parameters.applicationYear?0:balanceDelta);
    // No indirect effects in V1. An optional future model may have year-dependent effects.
    const adjustment=impacts.apply({year,referenceDeficit:reference,scenarioDeficit:scenarioBeforeImpact});
    return {year,reference,scenario:round(scenarioBeforeImpact+adjustment)};
   });
   return {
    modelId:'mechanical-v1',assumptions:parameters,rows,
    assessment:assessmentService.assess(
      rows.map(({year,scenario})=>({year,deficit:scenario})),
      parameters.applicationYear,
    ),
    warnings:[
      'Simulation mécanique indicative, non prédictive : prolongation de la référence de '+(parameters.baselineRatePerIndex*100)+' % de sa valeur initiale par année.',
      'Budget '+parameters.budgetYear+' : impact comptable constant à partir de '+parameters.applicationYear+', jusqu’à '+parameters.horizonYear+'. Il ne s’agit ni d’une prévision ni d’un programme présidentiel vérifié.',
    ],
   };
  },
 };
}
export const simulationService=createSimulationService();
