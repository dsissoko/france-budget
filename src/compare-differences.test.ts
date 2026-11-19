import {describe,expect,it} from 'vitest';
import {differentBudgetLines} from './compare-differences';
import type {Category} from './data';
const rows=[
 {id:'same',amount:100},
 {id:'difference',amount:65},
 {id:'both-vs-reference',amount:20},
 {id:'zero',amount:0},
] as Category[];
describe('Comparer: only show lines where the two budgets differ',()=>{
 it('excludes unchanged A/B lines even if both differ from the reference',()=>{
  expect(differentBudgetLines(rows,
   {same:100,difference:65,'both-vs-reference':25,zero:0},
   {same:100,difference:60,'both-vs-reference':25,zero:0}
  ).map(c=>c.id)).toEqual(['difference']);
 });
 it('includes a line when one side is the original reference',()=>{
  expect(differentBudgetLines(rows,{}, {difference:64}).map(c=>c.id)).toEqual(['difference']);
 });
 it('hides differences below the half-centième-of-Md€ threshold',()=>{
  expect(differentBudgetLines(rows,{difference:65},{difference:64.999}).length).toBe(0);
 });
 it('returns no lines when both budgets are identical',()=>{
  expect(differentBudgetLines(rows,{},{})).toEqual([]);
 });
});
