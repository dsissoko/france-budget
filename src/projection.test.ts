import {describe,it,expect} from 'vitest';
import {measures,expenses,revenues,offBudget,sum} from './data';
import {auditMeasure,calculateScenario,projectMeasure} from './projection';
describe('projection de contre-budgets',()=>{
 it('retrouve exactement les agrégats officiels APU 2025 INSEE',()=>{
  expect(sum(revenues)).toBeCloseTo(1561.6,8);
  expect(sum(expenses)).toBeCloseTo(1714.1,8);
  expect(sum(expenses)-sum(revenues)).toBeCloseTo(152.5,8);
  const base=calculateScenario([]);
  expect(base.revenueTotal).toBeCloseTo(1561.6,8);
  expect(base.expenseTotal).toBeCloseTo(1714.1,8);
  expect(base.deficit).toBeCloseTo(152.5,8);
 });
 it('affiche le même axe entreprises dans la référence et le budget simulé, sans double compte',()=>{
  const axis=expenses.find(c=>c.id==='enterprise-support');
  expect(axis?.amount).toBe(30);
  expect(expenses.find(c=>c.id==='economy')?.amount).toBe(125);
  expect(sum(expenses)).toBeCloseTo(1714.1,8);
  const changed=calculateScenario([],{revenues:{},expenses:{'enterprise-support':20}});
  expect(changed.expenses['enterprise-support']).toBe(20);
  expect(changed.deficit).toBeCloseTo(142.5,8);
 });
 it('adds off-budget reliefs only as revenue variations, without shifting 2025 baseline',()=>{
  expect(offBudget.map(c=>c.amount)).toEqual([49.7,69.1]);
  const original=calculateScenario([]);
  expect(original.offBudget['business-tax-relief']).toBe(49.7);
  expect(original.offBudget['business-social-relief']).toBe(69.1);
  expect(original.deficit).toBeCloseTo(152.5);
  const cut=calculateScenario([],{revenues:{},expenses:{},offBudget:{'business-tax-relief':39.7}});
  expect(cut.revenues.business).toBe(120);
  expect(cut.revenueTotal).toBeCloseTo(1571.6);
  expect(cut.expenseTotal).toBeCloseTo(1714.1);
  expect(cut.deficit).toBeCloseTo(142.5);
  expect(cut.balanceDelta).toBeCloseTo(10);
  const increase=calculateScenario([],{revenues:{},expenses:{},offBudget:{'business-social-relief':79.1}});
  expect(increase.revenues.contributions).toBe(510);
  expect(increase.deficit).toBeCloseTo(162.5);
 });
 it('enforces 0 to twice baseline for every off-budget adjustment',()=>{
  const below=calculateScenario([],{revenues:{},expenses:{},offBudget:{'business-tax-relief':-1}});
  const above=calculateScenario([],{revenues:{},expenses:{},offBudget:{'business-tax-relief':100}});
  expect(below.deficit).toBeCloseTo(152.5);
  expect(above.deficit).toBeCloseTo(152.5);
  expect(below.warnings.join(' ')).toContain('hors budget invalide');
  expect(above.warnings.join(' ')).toContain('hors budget invalide');
  const zero=calculateScenario([],{revenues:{},expenses:{},offBudget:{'business-tax-relief':0}});
  const max=calculateScenario([],{revenues:{},expenses:{},offBudget:{'business-tax-relief':99.4}});
  expect(zero.deficit).toBeCloseTo(102.8);
  expect(max.deficit).toBeCloseTo(202.2);
 });
  it('ventile les 620 Md€ indicatifs en quatre postes sans changer le total',()=>{
  expect(['social','family','unemployment','solidarity'].map(id=>expenses.find(c=>c.id===id)?.amount)).toEqual([400,65,50,105]);
  expect(sum(expenses)).toBeCloseTo(1714.1,8);
  const result=calculateScenario([],{revenues:{},expenses:{family:60}});
  expect(result.deficit).toBeCloseTo(147.5,8);
 });
 it('reproduit les 5 montants revendiqués RN / LFI sans confondre cette égalité avec une preuve économique',()=>{
  const published=measures.filter(m=>m.status==='publié');
  expect(published).toHaveLength(5);
  for(const m of published){
   const a=auditMeasure(m);
   expect(a.status).toBe('reproduced');
   expect(a.discrepancy).toBe(0);
   expect(a.entries.length).toBeGreaterThan(0);
   expect(a.explanation).toContain('pas validation économique');
  }
 });
 it('ventile une mesure sur plusieurs lignes sans changer son impact revendiqué',()=>{
  const m=measures.find(m=>m.id==='lfi-green')!;
  const entries=projectMeasure(m);
  expect(entries).toHaveLength(2);
  expect(entries.reduce((s,e)=>s+e.amount,0)).toBeCloseTo(10.6,8);
 });
 it('sépare les effets directs et le canal macroéconomique non modélisé pour les prestations',()=>{
  const m=measures.find(m=>m.id==='rn-social')!;
  expect(projectMeasure(m)).toEqual([expect.objectContaining({side:'expenses',categoryId:'social',amount:-6.1})]);
  expect(calculateScenario(['rn-social']).warnings.join(' ')).toContain('Hypothèse spécifique');
 });
 it('conserve le solde de la référence quand aucune mesure n’est activée',()=>{
  const base=calculateScenario([]);
  expect(base.balanceDelta).toBe(0);
  expect(base.deficit).toBeCloseTo(base.expenseTotal-base.revenueTotal);
 });
 it('additionne une variation manuelle une seule fois, en plus des projections',()=>{
  const base=calculateScenario([]);
  const change=calculateScenario(['rn-vat'],{revenues:{vat:270},expenses:{health:290}});
  expect(change.balanceDelta).toBeCloseTo(-10.96,8); // +10 de TVA, +10 santé => annulation
  expect(change.deficit-base.deficit).toBeCloseTo(10.96,8);
 });
 it('signale le mélange de millésimes et les interactions non chiffrées',()=>{
  const result=calculateScenario(['rn-social','hor-tax']);
  expect(result.warnings.some(w=>w.includes('millésimes'))).toBe(true);
  expect(result.warnings.some(w=>w.includes('double compte'))).toBe(true);
 });
});
