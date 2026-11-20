import {describe,it,expect} from 'vitest';
import {formatSummaryAmount} from './BudgetSummary';
import {budgetMaturity} from '../budget-maturity';

describe('Synthèse budget : unités et maturité',()=>{
 it('formate les chiffres sans répéter Md€ (unité dans en-tête)',()=>{
  expect(formatSummaryAmount(1561.7)).toBe('1 561,7');
  expect(formatSummaryAmount(1728.4)).toBe('1 728,4');
  expect(formatSummaryAmount(166.7)).toBe('166,7');
  expect(formatSummaryAmount(0)).toBe('0');
 });
 it('montre le badge de maturité pour un parti seulement',()=>{
  expect(budgetMaturity({origin:'party',maturity_status:'en_preparation'})?.label).toBe('En préparation');
  expect(budgetMaturity({origin:'citizen',maturity_status:'en_preparation'})).toBeNull();
 });
});
