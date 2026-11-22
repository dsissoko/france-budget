import {describe,it,expect} from 'vitest';
import {calculatePublishedBudget,calculateAggregateCitizenBudget,aggregateMode} from './party-budget';
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
 it('projette automatiquement les ventilations CSV sur les postes sans modifier les agrégats',()=>{
  const allocated={...party,scenario:{...party.scenario,claimedAllocations:[
    {side:'revenues' as const,categoryId:'business',amount:19.9},
    {side:'expenses' as const,categoryId:'education',amount:7.6},
  ]}};
  const result=calculatePublishedBudget(allocated,reference);
  expect(result.revenues.business).toBeCloseTo(119.9);
  expect(result.revenues.other).toBeCloseTo(86.5);
  expect(result.expenses.education).toBeCloseTo(127.6);
  expect(result.expenses['other-expenses']).toBeCloseTo(84.1);
  expect(result.revenueTotal).toBeCloseTo(206.4);
  expect(result.expenseTotal).toBeCloseTo(211.7);
  expect(result.balanceDelta).toBeCloseTo(24.7);
  expect(result.entries).toHaveLength(4);
 });
 it('refuse une ventilation qui dépasse les masses revendiquées',()=>{
  const wrong={...party,scenario:{...party.scenario,claimedAllocations:[{side:'revenues' as const,categoryId:'business',amount:200}]}};
  expect(()=>calculatePublishedBudget(wrong,reference)).toThrow('supérieure aux agrégats');
 });
 it('restitue un budget global avec deux masses seulement, sans troisième chiffre',()=>{
  const {balanceDeltaBn:_,...twoNumbers}=claim;
  const result=calculatePublishedBudget({...party,scenario:{...party.scenario,claimedTotals:twoNumbers}},reference);
  expect(result.balanceDelta).toBeCloseTo(24.7,2);
  expect(result.entries).toHaveLength(2);
 });
 it('revient au mode partiel si une seule des deux masses est disponible',()=>{
  const incomplete={...claim,expensesBn:undefined as unknown as number};
  const p={...party,scenario:{...party.scenario,claimedTotals:incomplete}};
  expect(aggregateMode(p)).toBe(false);
  expect(calculatePublishedBudget(p,reference).balanceDelta).toBe(-5);
 });
 it('accepte les baisses nettes de recettes et dépenses revendiquées par RN 2026',()=>{
  const rn={...claim,revenuesBn:-14,expensesBn:-50,balanceDeltaBn:36};
  const result=calculatePublishedBudget({...party,scenario:{...party.scenario,claimedTotals:rn}},reference);
  expect(result.balanceDelta).toBe(36);
  expect(result.revenueTotal).toBe(86);
  expect(result.expenseTotal).toBe(80);
 });
 it('distingue le solde calculé des deux masses d’un solde politique avec effets indirects',()=>{
  const eqx={...claim,revenuesBn:59,expensesBn:-14.4,balanceDeltaBn:73.4};
  expect(calculatePublishedBudget({...party,scenario:{...party.scenario,claimedTotals:eqx}},reference).balanceDelta).toBeCloseTo(73.4);
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


describe('Issue #94 — reprise citoyenne d’un budget AGGREGATE',()=>{
 it('conserve les masses du parti même sans mesure détaillée',()=>{
  const baseline=calculatePublishedBudget(party,reference);
  const citizen=calculateAggregateCitizenBudget(claim,[],{revenues:{},expenses:{}},reference);
  expect(citizen.revenueTotal).toBe(baseline.revenueTotal);
  expect(citizen.expenseTotal).toBe(baseline.expenseTotal);
  expect(citizen.balanceDelta).toBe(baseline.balanceDelta);
  expect(citizen.entries).toHaveLength(2);
 });
 it('ajoute seulement les mesures nouvelles sans réadditionner les mesures du parti',()=>{
  // La mesure "item" existe déjà dans le budget politique initial ; le
  // citoyen ne la sélectionne pas de nouveau à la reprise.
  const citizen=calculateAggregateCitizenBudget(claim,['item'],{revenues:{},expenses:{}},reference);
  expect(citizen.revenueTotal).toBeCloseTo(206.4,2);
  expect(citizen.expenseTotal).toBeCloseTo(216.7,2);
  expect(citizen.balanceDelta).toBeCloseTo(19.7,2);
  expect(citizen.entries).toHaveLength(3);
 });
 it('ne rejoue pas les mesures politiques déjà comprises dans les agrégats',()=>{
  const citizen=calculateAggregateCitizenBudget(claim,['item'],{revenues:{},expenses:{}},reference,['item']);
  expect(citizen.expenseTotal).toBeCloseTo(211.7,2);
  expect(citizen.balanceDelta).toBeCloseTo(24.7,2);
  expect(citizen.entries).toHaveLength(2);
 });
 it('combine les nouvelles mesures et les réglages citoyens sur les agrégats',()=>{
  const citizen=calculateAggregateCitizenBudget(claim,['item'],{revenues:{business:110},expenses:{}},reference);
  expect(citizen.revenueTotal).toBeCloseTo(216.4,2);
  expect(citizen.expenseTotal).toBeCloseTo(216.7,2);
  expect(citizen.balanceDelta).toBeCloseTo(29.7,2);
 });
});
