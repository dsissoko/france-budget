import {describe,it,expect} from 'vitest';
import {assessmentService} from './assessment';
import {createSimulationService,yearsFor,type SimulationParameters} from './simulation';

describe('Issue #22 — seuils de qualification configurables',()=>{
 it('change le diagnostic lorsque les seuils de la version Neon changent',()=>{
  const rows=[{year:2027,deficit:1},{year:2028,deficit:1.2},{year:2029,deficit:1.4}];
  const strict=assessmentService.assess(rows,2027,{balanceThreshold:0.05,changeThreshold:0.1,momentumThreshold:0.5});
  const tolerant=assessmentService.assess(rows,2027,{balanceThreshold:0.05,changeThreshold:1,momentumThreshold:0.5});
  expect(strict.code).toBe('INCREASE_STEADY');
  expect(tolerant.code).toBe('DEFICIT_STABLE');
 });
 it('propage les seuils depuis les paramètres de simulation',()=>{
  const p:SimulationParameters={referenceYear:2025,budgetYear:2027,applicationYear:2027,horizonYear:2030,baselineRatePerIndex:0.025,
   assessment:{balanceThreshold:0.05,changeThreshold:100,momentumThreshold:0.5}};
  const result=createSimulationService().simulate(100,0,yearsFor(p),p);
  expect(result.assumptions.assessment).toEqual(p.assessment);
  expect(result.assessment.code).toBe('DEFICIT_STABLE');
 });
});
