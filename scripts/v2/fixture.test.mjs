import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadBatch} from './import.mjs';

test('NoPasaran baseline: 8 proposals / 8 impacts and latest version',()=>{
 const x=loadBatch('data/programmes/nopasaran/2025');
 assert.equal(x.budget.version,'latest');
 assert.equal(x.budget.origin,'citizen');
 assert.equal(x.proposals.length,8);
 assert.equal(x.impacts.length,8);
 assert.equal(x.impacts.find(i=>i.category_id==='defense')?.delta_amount_bn,'-25');
});
test('same structure for all political budgets; documentary sources survive parsing',()=>{
 const eco=loadBatch('data/programmes/eco/2027');
 const eqx=loadBatch('data/programmes/eqx/2027');
 const rn=loadBatch('data/programmes/rn/2026');
 assert.equal(eco.budget.version,'latest');
 assert.equal(eco.budget.origin,'party');
 assert.equal(eco.proposals.length,4);
 assert.ok(eco.budget.documentary.sources.length>0);
 assert.equal(eqx.proposals.length,14);
 assert.ok(eqx.budget.documentary.aggregates.length>0);
 assert.equal(rn.proposals.length,78);
 assert.equal(rn.impacts.length,0,'no invented impacts in political CSV');
});
