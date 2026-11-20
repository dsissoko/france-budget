import {describe,it,expect} from 'vitest';
import {calculateScenario} from '../projection';
import {gaugeAmount,gaugeOverride} from './gauge';
import {revenues,expenses} from '../data';
describe('budget gauges are derived from the accounting result',()=>{
 const empty={revenues:{},expenses:{}};
 it('shows the applied political measures in the actual lines',()=>{
  const r=calculateScenario(['rn-vat','rn-social','rn-agencies'],empty);
  expect(gaugeAmount(r,'revenues','vat')).toBeCloseTo(245.54);
  expect(gaugeAmount(r,'expenses','social')).toBeCloseTo(393.9);
  expect(gaugeAmount(r,'expenses','general')).toBeCloseTo(141.79);
 });
 it('changes a line to the requested value without applying the measure twice',()=>{
  const before=calculateScenario(['rn-vat'],empty);
  const vat=revenues.find(r=>r.id==='vat')!;
  const absolute=gaugeOverride('revenues','vat',255,vat.amount,empty,before);
  const after=calculateScenario(['rn-vat'],{revenues:{vat:absolute},expenses:{}});
  expect(after.revenues.vat).toBeCloseTo(255);
  expect(after.deficit).toBeCloseTo(before.deficit-9.46);
 });
 it('edits off-budget advantages through the same gauge engine',()=>{
  const before=calculateScenario([],empty);
  const target=gaugeOverride('offBudget','business-tax-relief',39.7,49.7,empty,before);
  const result=calculateScenario([],{...empty,offBudget:{'business-tax-relief':target}});
  expect(target).toBeCloseTo(39.7);
  expect(gaugeAmount(result,'offBudget','business-tax-relief')).toBeCloseTo(39.7);
  expect(result.deficit).toBeCloseTo(142.5);
 });
 it('preserves citizen absolute overrides and accounting when no measure is selected',()=>{
  const before=calculateScenario([],{revenues:{},expenses:{defense:31}});
  const defense=expenses.find(r=>r.id==='defense')!;
  const absolute=gaugeOverride('expenses','defense',40,defense.amount,{revenues:{},expenses:{defense:31}},before);
  expect(absolute).toBe(40);
  expect(calculateScenario([],{revenues:{},expenses:{defense:absolute}}).expenses.defense).toBe(40);
 });
});
