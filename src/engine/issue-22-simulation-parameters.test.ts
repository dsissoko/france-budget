import {describe,expect,it} from 'vitest';
import {createSimulationService,yearsFor,type SimulationParameters} from './simulation';

const fromNeon:SimulationParameters={
 referenceYear:2025,budgetYear:2028,applicationYear:2028,horizonYear:2030,baselineRatePerIndex:0.04,
};
describe('Issue #22 — paramètres versionnés Neon',()=>{
 it('calcule le calendrier à partir des paramètres et non des constantes V1',()=>{
  expect(yearsFor(fromNeon)).toEqual([2025,2026,2027,2028,2029,2030]);
 });
 it('applique le taux et la date de prise d’effet injectés',()=>{
  const result=createSimulationService().simulate(100,10,yearsFor(fromNeon),fromNeon);
  expect(result.assumptions).toEqual(fromNeon);
  expect(result.rows.find(x=>x.year===2027)).toMatchObject({reference:108,scenario:108});
  expect(result.rows.find(x=>x.year===2028)).toMatchObject({reference:112,scenario:102});
  expect(result.rows.find(x=>x.year===2030)).toMatchObject({reference:120,scenario:110});
 });
});
