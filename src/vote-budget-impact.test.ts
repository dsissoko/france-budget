import {describe,it,expect} from 'vitest';
import {voteBudgetImpact} from './vote-budget-impact';

describe('voteBudgetImpact',()=>{
 it('qualifies a reduction without confusing it with a final surplus',()=>{
  expect(voteBudgetImpact(124,73.4).label).toBe('Déficit réduit');
 });
 it('identifies a genuine final surplus',()=>{
  expect(voteBudgetImpact(-5,210).label).toBe('Excédent');
 });
 it('identifies an aggravation',()=>{
  expect(voteBudgetImpact(200,-10).label).toBe('Déficit aggravé');
 });
 it('tolerates small changes',()=>{
  expect(voteBudgetImpact(180,0.5).label).toBe('Déficit stable');
 });
 it('does not qualify documentary-only budgets',()=>{
  expect(voteBudgetImpact(180,20,true).label).toBe('Non chiffré');
 });
});
