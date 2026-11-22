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

test('single-directory dry run does not require any database credential',async()=>{
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync(process.execPath,['scripts/v2/import.mjs','data/programmes/nopasaran/2025'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/DRY RUN: no database writes/);
 assert.match(result.stdout,/"budget_key":"nopasaran-2025"/);
});

test('NoPasaran 8 accounting positions match the recorded V1 QA benchmark',()=>{
 const x=loadBatch('data/programmes/nopasaran/2025');
 const baseline={
  'expenses:defense':55.4,'expenses:general':185.6,'expenses:social':443.5,
  'offBudget:business-social-relief':69.1,'offBudget:business-tax-relief':49.7,
  'revenues:business':86.6,'revenues:income':103.6,'revenues:property':71.5
 };
 const expected={
  'expenses:defense':30.4,'expenses:general':173.6,'expenses:social':403.5,
  'offBudget:business-social-relief':75.1,'offBudget:business-tax-relief':9.7,
  'revenues:business':99.8,'revenues:income':138.6,'revenues:property':91.5
 };
 assert.equal(x.impacts.length,Object.keys(expected).length);
 for(const i of x.impacts){
  const k=i.side+':'+i.category_id;
  assert.ok(Object.hasOwn(expected,k),'unexpected citizen pivot: '+k);
  assert.ok(Math.abs(baseline[k]+Number(i.delta_amount_bn)-expected[k])<0.0001,k+' must conserve V1 values');
 }
});

test('LFI 2027: 28 source measures and a single grouped education pivot impact',()=>{
 const x=loadBatch('data/programmes/lfi/2027');
 assert.equal(x.budget.budget_mode,'AGGREGATE');
 assert.equal(x.proposals.filter(p=>p.proposal_key.startsWith('src-')).length,28);
 assert.equal(x.proposals.length,29,'28 sources plus 1 deterministic pivot group');
 assert.equal(x.impacts.length,5,'six qualified contributions on five unique pivot posts');
 const edu=x.impacts.filter(i=>i.side==='expenses'&&i.category_id==='education');
 assert.equal(edu.length,1);
 assert.equal(edu[0].proposal_key,'pivot-expenses-education');
 assert.equal(edu[0].delta_amount_bn,'4.000');
 const members=x.proposals.filter(p=>['src-19','src-21'].includes(p.proposal_key));
 assert.equal(members.reduce((total,p)=>total+Number(p.claimed_amount_bn),0),4);
 assert.ok(members.every(p=>p.source_status==='grouped_into_pivot'));
 assert.deepEqual(new Set(x.impacts.map(i=>i.side+':'+i.category_id)).size,x.impacts.length);
 assert.equal(x.impacts.filter(i=>i.side==='revenues').reduce((sum,i)=>sum+Number(i.delta_amount_bn),0),3);
 assert.equal(x.impacts.filter(i=>i.side==='expenses').reduce((sum,i)=>sum+Number(i.delta_amount_bn),0),19);
 assert.equal(Number(x.budget.documentary.aggregates[0].balance_delta_bn),24.7,'global aggregate remains authoritative');
});
