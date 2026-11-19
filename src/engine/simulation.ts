import {assessmentService,type Assessment} from './assessment';
import {impactService,type ImpactService} from './impact';

// All V1 numerical assumptions are kept here, away from React.
export const V1_ASSUMPTIONS={baselineRatePerIndex:0.025,impactStartsAtIndex:1} as const;
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
   const rows=years.map((year,i)=>{
    const reference=round(baseDeficit*(1+V1_ASSUMPTIONS.baselineRatePerIndex*i));
    const scenarioBeforeImpact=round(baseDeficit*(1+V1_ASSUMPTIONS.baselineRatePerIndex*i)-(i<V1_ASSUMPTIONS.impactStartsAtIndex?0:balanceDelta));
    const adjustment=impacts.apply({year,referenceDeficit:reference,scenarioDeficit:scenarioBeforeImpact});
    return {year,reference,scenario:round(scenarioBeforeImpact+adjustment)};
   });
   return {
    modelId:'mechanical-v1',assumptions:V1_ASSUMPTIONS,rows,
    assessment:assessmentService.assess(rows.map(({year,scenario})=>({year,deficit:scenario}))),
    warnings:['Simulation mécanique indicative, non prédictive : référence +2,5 % par année-index, impact budgétaire constant à partir de 2026.'],
   };
  },
 };
}
export const simulationService=createSimulationService();
