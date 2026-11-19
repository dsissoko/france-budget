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
export interface ProjectionYear {year:number;reference:number;scenario:number}
export interface ProjectionResult {
 modelId:string;
 assumptions:typeof V1_ASSUMPTIONS;
 rows:ProjectionYear[];
 assessment:Assessment;
 warnings:string[];
}
export interface SimulationService {
 simulate(baseDeficit:number,balanceDelta:number,years:ReadonlyArray<number>):ProjectionResult;
}
const round=(n:number)=>Math.round(n*10)/10;
export function createSimulationService(impacts:ImpactService=impactService):SimulationService {
 return {
  simulate(baseDeficit,balanceDelta,years) {
   const rows=years.map(year=>{
    // Anchor the reference to 2025, not to the first requested display index.
    const unroundedReference=baseDeficit*(1+V1_ASSUMPTIONS.baselineRatePerIndex*(year-PROJECTION_CALENDAR.referenceYear));
    const reference=round(unroundedReference);
    const scenarioBeforeImpact=unroundedReference-(year<PROJECTION_CALENDAR.applicationYear?0:balanceDelta);
    // No indirect effects in V1. An optional future model may have year-dependent effects.
    const adjustment=impacts.apply({year,referenceDeficit:reference,scenarioDeficit:scenarioBeforeImpact});
    return {year,reference,scenario:round(scenarioBeforeImpact+adjustment)};
   });
   return {
    modelId:'mechanical-v1',assumptions:V1_ASSUMPTIONS,rows,
    assessment:assessmentService.assess(
      rows.map(({year,scenario})=>({year,deficit:scenario})),
      PROJECTION_CALENDAR.applicationYear,
    ),
    warnings:[
      'Simulation mécanique indicative, non prédictive : référence 2025 prolongée de 2,5 % de sa valeur initiale par année.',
      'Budget 2027 : impact comptable constant à partir de 2027, jusqu’à l’horizon de comparaison 2032. Il ne s’agit ni d’une prévision ni d’un programme présidentiel vérifié.',
    ],
   };
  },
 };
}
export const simulationService=createSimulationService();
