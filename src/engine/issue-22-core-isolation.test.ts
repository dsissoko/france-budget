import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {calculateScenario,projectMeasure,type ReferenceModel} from '../projection-core';
const reference:ReferenceModel={
 revenues:[{id:'tax',label:'Tax',amount:100,canonical:'',description:''}],
 expenses:[{id:'service',label:'Service',amount:120,canonical:'',description:''}],
 offBudget:[],
 measures:[{id:'m1',party:'P',theme:'T',title:'Measure',revenueDelta:5,expenseDelta:0,source:'Neon',year:2027,status:'publié',referenceOrigin:'neon',description:'',apuEntries:[{side:'revenues',categoryId:'tax',amount:5}]}]
};
describe('Issue #22 — moteur de production sans fixtures',()=>{
 it('utilise exclusivement le référentiel injecté',()=>{
  const result=calculateScenario(['m1'],{revenues:{},expenses:{}},[],reference);
  expect(result.revenueTotal).toBe(105);
  expect(result.expenseTotal).toBe(120);
  expect(result.deficit).toBe(15);
 });
 it('rejette une mesure sans affectation APU Neon',()=>{
  expect(()=>projectMeasure({...reference.measures[0],apuEntries:undefined},reference)).toThrow('Affectation APU Neon absente');
 });
 it('ne dépend ni de data.ts ni des règles politiques statiques',()=>{
  const core=readFileSync(new URL('../projection-core.ts',import.meta.url),'utf8');
  const app=readFileSync(new URL('../App.tsx',import.meta.url),'utf8');
  expect(core).not.toMatch(/from ['"]\.\/data['"]/);
  expect(core).not.toContain('rn-social');
  expect(core).not.toContain('export const rules');
  expect(app).toContain("from './projection-core'");
  expect(app).not.toContain("from './projection'");
  expect(app).not.toContain("from './data'");
 });
});
