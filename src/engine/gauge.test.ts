import {describe,it,expect} from 'vitest';
import {calculateScenario} from '../projection';
import {gaugeAmount,gaugeOverride} from './gauge';
import {revenues,expenses} from '../data';
describe('budget gauges are derived from the accounting result',()=>{
 const empty={revenues:{},expenses:{}};
 it('shows the applied political measures in the actual lines',()=>{
  const r=calculateScenario(['rn-vat','rn-social','rn-agencies'],empty);
  expect(gaugeAmount(r,'revenues','vat')).toBeCloseTo(249.04);
  expect(gaugeAmount(r,'expenses','social')).toBeCloseTo(393.9);
  expect(gaugeAmount(r,'expenses','general')).toBeCloseTo(142.3);
 });
 it('changes a line to the requested value without applying the measure twice',()=>{
  const before=calculateScenario(['rn-vat'],empty);
  const vat=revenues.find(r=>r.id==='vat')!;
  const absolute=gaugeOverride('revenues','vat',255,vat.amount,empty,before);
  const after=calculateScenario(['rn-vat'],{revenues:{vat:absolute},expenses:{}});
  expect(after.revenues.vat).toBeCloseTo(255);
  expect(after.deficit).toBeCloseTo(before.deficit-5.96);
 });
 it('preserves citizen absolute overrides and accounting when no measure is selected',()=>{
  const before=calculateScenario([],{revenues:{},expenses:{defense:31}});
  const defense=expenses.find(r=>r.id==='defense')!;
  const absolute=gaugeOverride('expenses','defense',40,defense.amount,{revenues:{},expenses:{defense:31}},before);
  expect(absolute).toBe(40);
  expect(calculateScenario([],{revenues:{},expenses:{defense:absolute}}).expenses.defense).toBe(40);
 });
});
