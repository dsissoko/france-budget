import {describe,it} from 'node:test';
import {strict as assert} from 'node:assert';
import {loadBatch} from './import.mjs';

const b=loadBatch('data/programmes/lfi/2027');
const doc=b.budget.documentary;
const round=n=>Math.round(n*10)/10;
describe('PR 145 → LFI 2027 V2, à partir des vrais CSV',()=>{
 it('conserve les 28 mesures sources et 11 propositions pédagogiques',()=>{
  assert.equal(doc.citizenGroups.length,11);
  const lines=doc.citizenGroups.flatMap(g=>g.sourceLines);
  assert.equal(lines.length,28);
  assert.equal(new Set(lines.map(x=>x.id)).size,28);
  assert.equal(lines.filter(x=>!x.sourceUrl?.startsWith('https://')).length,0);
  assert.equal(doc.citizenGroups.reduce((n,g)=>n+g.sourceCount,0),28);
 });
 it('conserve 15 postes exclusifs dont 11 allocations activées',()=>{
  const rows=doc.citizenGroups.flatMap(g=>g.citizenImpacts);
  assert.equal(rows.length,15);
  assert.equal(new Set(rows.map(x=>x.categoryId)).size,15);
  assert.equal(rows.filter(x=>x.simulated).length,11);
  assert.equal(doc.claimedAllocations.length,11);
 });
 it('réconcilie exactement les masses revendiquées sans les doubler',()=>{
  const sums={revenues:0,expenses:0};
  for(const a of doc.claimedAllocations)sums[a.side]+=a.amount;
  assert.equal(round(sums.revenues),84.4);
  assert.equal(round(sums.expenses),37.7);
  assert.equal(round(Number(doc.aggregates[0].revenues_bn)-sums.revenues),22);
  assert.equal(round(Number(doc.aggregates[0].expenses_bn)-sums.expenses),44);
  assert.equal(round(Number(doc.aggregates[0].revenues_bn)-Number(doc.aggregates[0].expenses_bn)),24.7);
 });
 it('importe la présentation éditoriale sans URL brute dans le libellé',()=>{
  assert.match(b.budget.description,/106,4 Md€/);
  assert.doesNotMatch(b.budget.description,/https?:\/\//);
 });
});
