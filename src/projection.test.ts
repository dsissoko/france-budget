import {describe,it,expect} from 'vitest';
import {measures,expenses,revenues,sum} from './data';
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
