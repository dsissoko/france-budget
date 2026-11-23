import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateEditorialDirectories,validateEditorialUpgrade} from './editorial-upgrade.mjs';

const batch=()=>({
 budget:{budget_key:'example-2027',version:'latest',description:'Ancienne présentation',
  origin:'party',budget_mode:'PARTIAL',documentary:{sources:[{source_url:'https://example.org/2027'}],
   background_text:'Ancienne présentation',aggregates:[{revenues_bn:'2'}]}},
 proposals:[{budget_key:'example-2027',proposal_key:'p1',title:'Ancien titre',description:'',
   impacts:[]}],
 measures:[{measure_key:'m1',proposal_key:'p1',claimed_amount_bn:'1.000'}],
 impacts:[{proposal_key:'p1',side:'expenses',category_id:'education',delta_amount_bn:'1.000'}]
});
const copy=x=>structuredClone(x);

test('accepts only editorial fields, including matching background_text',()=>{
 const a=batch(),b=copy(a);
 b.budget.description='Présentation fidèle au programme';
 b.budget.documentary.background_text='Présentation fidèle au programme';
 b.proposals[0].title='Nouveau titre précis';
 b.proposals[0].description='Description contextualisée et sourcée';
 const changes=validateEditorialUpgrade(a,b);
 assert.equal(changes.length,4);
 assert.deepEqual(changes.map(x=>x.field),['description','documentary.background_text','title','description']);
});

test('rejects modifications of source measures, financial impacts, and aggregates',()=>{
 for(const mutate of [
  b=>{b.measures[0].claimed_amount_bn='3.000';},
  b=>{b.impacts[0].delta_amount_bn='2.000';},
  b=>{b.budget.documentary.aggregates[0].revenues_bn='3';},
  b=>{b.budget.budget_mode='AGGREGATE';},
  b=>{b.proposals[0].proposal_key='different';},
  b=>{b.budget.documentary.sources[0].source_url='https://invalid.example';},
  b=>{b.proposals.push({...b.proposals[0],proposal_key:'p2'});}
 ]){
  const a=batch(),b=copy(a);
  mutate(b);
  assert.throws(()=>validateEditorialUpgrade(a,b),/EDITORIAL_UPGRADE rejected/);
 }
});

function withDirectories(action){
 const root=mkdtempSync(join(tmpdir(),'editorial-upgrade-'));
 const before=join(root,'before'),after=join(root,'after');
 mkdirSync(before);mkdirSync(after);
 const fixtures={
  'budget.csv':'budget_key,version,title,description,origin,reference_year,budget_mode,party_code,documentary_json\nexample-2027,latest,Exemple,Ancien,party,2025,PARTIAL,EX,"{""sources"":[{""source_url"":""https://example.org""}]}"\n',
  'proposals.csv':'budget_key,proposal_key,title,description\nexample-2027,p1,Titre,Description\n',
  'measures.csv':'budget_key,measure_key,proposal_key,title,description,claimed_amount_bn,source_url\nexample-2027,m1,p1,Mesure,Description,1.000,https://example.org\n',
  'impacts.csv':'budget_key,proposal_key,side,category_id,delta_amount_bn\nexample-2027,p1,expenses,education,1.000\n'
 };
 for(const [name,text] of Object.entries(fixtures)){
  writeFileSync(join(before,name),text);
  writeFileSync(join(after,name),text);
 }
 try{action(before,after);}finally{rmSync(root,{recursive:true,force:true});}
}

test('accepts canonical program and proposition descriptions edited in CSV',()=>{
 withDirectories((before,after)=>{
  const path=join(after,'budget.csv');
  writeFileSync(path,readFileSync(path,'utf8').replace(',Ancien,',',Présentation claire,'));
  const proposals=join(after,'proposals.csv');
  writeFileSync(proposals,readFileSync(proposals,'utf8').replace(',Description\n',',Explication plus détaillée\n'));
  const changes=validateEditorialDirectories(before,after);
  assert.deepEqual(changes.map(x=>x.type),['budget','proposal']);
 });
});

test('rejects changed impacts.csv even if the rest is unchanged',()=>{
 withDirectories((before,after)=>{
  const path=join(after,'impacts.csv');
  writeFileSync(path,readFileSync(path,'utf8').replace('1.000','2.000'));
  assert.throws(()=>validateEditorialDirectories(before,after),/impacts.csv/);
 });
});

test('rejects newly added or deleted CSV files',()=>{
 withDirectories((before,after)=>{
  writeFileSync(join(after,'extra.csv'),'id\n1\n');
  assert.throws(()=>validateEditorialDirectories(before,after),/file inventory/);
 });
});

test('rejects inconsistent presentation.csv override',()=>{
 withDirectories((before,after)=>{
  writeFileSync(join(before,'presentation.csv'),'party_code,year,title,description,source_url\nEX,2027,Exemple,Ancien,https://example.org\n');
  writeFileSync(join(after,'presentation.csv'),'party_code,year,title,description,source_url\nEX,2027,Exemple,Nouveau,https://example.org\n');
  assert.throws(()=>validateEditorialDirectories(before,after),/must match budget.csv description/);
 });
});
