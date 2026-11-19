import {describe, expect, it} from 'vitest';
import {publishedBudgetUrl, readBudgetLink, samePublishedScenario} from './share';

const zero={revenues:[{id:'vat',amount:100}],expenses:[{id:'health',amount:120}]};
const current={budget:{revenues:{vat:110},expenses:{}},picked:['m2','m1'],citizenMeasures:[]};

describe('shareable published budgets',()=>{
  it('creates a permanent link for a public budget',()=>{
    expect(publishedBudgetUrl('1234','https://mon-budget-citoyen.vercel.app/')).toBe('https://mon-budget-citoyen.vercel.app/b/1234');
  });
  it('reads a valid incoming budget identifier only',()=>{
    const id='123e4567-e89b-12d3-a456-426614174000';
    expect(readBudgetLink('?budget='+id)).toBe(id);
    expect(readBudgetLink('?budget=invalid')).toBeNull();
  });
  it('matches effective current scenario despite missing default keys or reordered measures',()=>{
    expect(samePublishedScenario(current,{budget:{revenues:{vat:110},expenses:{health:120}},picked:['m1','m2']},zero.revenues,zero.expenses)).toBe(true);
  });
  it('rejects unpublished changes',()=>{
    expect(samePublishedScenario(current,{budget:{revenues:{vat:100},expenses:{health:120}},picked:['m1','m2']},zero.revenues,zero.expenses)).toBe(false);
  });
});
