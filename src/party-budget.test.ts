import {describe,it,expect} from 'vitest';
import {calculatePublishedBudget,aggregateMode} from './party-budget';
import type {ReferenceModel} from './projection-core';

const reference:ReferenceModel={
 revenues:[{id:'business',label:'IS',amount:100,canonical:'test',description:''},{id:'other',label:'Ajustement',amount:0,canonical:'test',description:''}],
 expenses:[{id:'education',label:'Education',amount:120,canonical:'test',description:''},{id:'other-expenses',label:'Ajustement',amount:10,canonical:'test',description:''}],
 offBudget:[],
 measures:[{id:'item',party:'TEST',theme:'Education',title:'Measure',revenueDelta:0,expenseDelta:5,
  source:'https://example.org/file',year:2027,status:'publié',description:'',
  apuEntries:[{side:'expenses',categoryId:'education',amount:5}]}],
};
const claim={year:2027,basis:'delta' as const,revenuesBn:106.4,expensesBn:81.7,balanceDeltaBn:24.7,sourceUrl:'https://example.org/budget.pdf'};
const party={origin:'party' as const,scenario:{picked:['item'],budget:{revenues:{},expenses:{}},claimedTotals:claim}};
describe('Moteur à deux modes : agrégats sourcés ou référence + deltas',()=>{
 it('donne priorité aux agrégats et ne double pas les mesures détaillées',()=>{
  const result=calculatePublishedBudget(party,reference);
  expect(result.revenueTotal).toBeCloseTo(206.4,2);
  expect(result.expenseTotal).toBeCloseTo(211.7,2);
  expect(result.balanceDelta).toBeCloseTo(24.7,2);
  expect(result.deficit).toBeCloseTo(5.3,2);
  expect(result.entries).toHaveLength(2);
  expect(aggregateMode(party)).toBe(true);
 });
 it('restitue un budget global avec deux masses seulement, sans troisième chiffre',()=>{
  const {balanceDeltaBn:_,...twoNumbers}=claim;
  const result=calculatePublishedBudget({...party,scenario:{...party.scenario,claimedTotals:twoNumbers}},reference);
  expect(result.balanceDelta).toBeCloseTo(24.7,2);
  expect(result.entries).toHaveLength(2);
 });
 it('emploie la référence INSEE et les mesures actives sans agrégats globaux',()=>{
  const result=calculatePublishedBudget({...party,scenario:{picked:['item'],budget:{revenues:{},expenses:{}}}},reference);
  expect(result.balanceDelta).toBe(-5);
  expect(result.deficit).toBe(35);
 });
 it('accepte des totaux absolus si leur solde est cohérent',()=>{
  const p={...party,scenario:{...party.scenario,claimedTotals:{...claim,basis:'total' as const,revenuesBn:205,expensesBn:220,balanceDeltaBn:15}}};
  expect(calculatePublishedBudget(p,reference).balanceDelta).toBeCloseTo(15,2);
 });
 it('refuse les montants incohérents plutôt que masquer une erreur',()=>{
  expect(()=>calculatePublishedBudget({...party,scenario:{...party.scenario,claimedTotals:{...claim,balanceDeltaBn:100}}},reference)).toThrow('non réconciliés');
 });
 it('n’emploie pas des agrégats politiques pour un budget citoyen',()=>{
  const b={...party,origin:'citizen' as const};
  expect(calculatePublishedBudget(b,reference).balanceDelta).toBe(-5);
 });
});
