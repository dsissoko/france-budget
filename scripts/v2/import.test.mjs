import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCsv,validateBatch} from './import.mjs';
const b={budget_key:'test',version:'latest',title:'Test',origin:'citizen',reference_year:'2025',budget_mode:'PARTIAL',documentary_json:'{"sources":[{"source_url":"https://example.org"}]}'};
const p=[{budget_key:'test',proposal_key:'p1',title:'Proposal',description:'Ventilation: +1 sur dépenses sociales',claimed_amount_bn:'1',source_url:'https://example.org'}];
const i=[{budget_key:'test',proposal_key:'p1',side:'expenses',category_id:'social',delta_amount_bn:'1'}];
test('CSV parser preserves quotes, commas and multiline documentary descriptions',()=>{
 const x=readCsv('id,description\n"p1","Texte, avec ""citation""\net détail"\n');
 assert.equal(x[0].description,'Texte, avec "citation"\net détail');
});
test('single canonical batch validates and preserves documentary data',()=>{
 const result=validateBatch(b,p,i);
 assert.equal(result.impacts.length,1);
 assert.equal(result.budget.documentary.sources[0].source_url,'https://example.org');
});
test('must not infer missing impacts',()=>{
 assert.equal(validateBatch(b,p,[]).impacts.length,0);
});
test('rejects duplicated budget pivot posts',()=>{
 assert.throws(()=>validateBatch(b,[...p,{...p[0],proposal_key:'p2'}],[...i,{...i[0],proposal_key:'p2'}]),/Duplicate impact post/);
});
test('rejects undocumented impact and malformed source',()=>{
 assert.throws(()=>validateBatch(b,[{...p[0],description:''}],i),/documented description/);
 assert.throws(()=>validateBatch(b,[{...p[0],source_url:'not-a-url'}],i),/Invalid source URL/);
});
test('requires explicit version and valid documentary JSON',()=>{
 assert.throws(()=>validateBatch({...b,version:''},p,i),/missing version/);
 assert.throws(()=>validateBatch({...b,documentary_json:'{'},p,i),/Invalid documentary_json/);
});
test('rejects wrong post units and unknown proposals',()=>{
 assert.throws(()=>validateBatch(b,p,[{...i[0],delta_amount_bn:'12,5'}]),/Invalid impact amount/);
 assert.throws(()=>validateBatch(b,p,[{...i[0],proposal_key:'pX'}]),/Orphan impact/);
});
