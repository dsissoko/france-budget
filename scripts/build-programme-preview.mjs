#!/usr/bin/env node
// Rebuild the read-only programme preview from versioned CSV only.
// Usage: node scripts/build-programme-preview.mjs lfi 2027 [--check]
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

function csv(file){
 const raw=readFileSync(file,'utf8'),rows=[];let fields=[],value='',quoted=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(c==='"'){if(quoted&&raw[i+1]==='"'){value+='"';i++}else quoted=!quoted}
  else if(c===','&&!quoted){fields.push(value);value=''}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&raw[i+1]==='\n')i++;
   fields.push(value);if(fields.some(x=>x!==''))rows.push(fields);
   fields=[];value='';
  }else value+=c;
 }
 if(quoted)throw Error('CSV unterminated quote: '+file);
 if(fields.length||value){fields.push(value);rows.push(fields)}
 const [head,...body]=rows;
 if(!head)throw Error('Empty CSV: '+file);
 return body.map((values,i)=>{
  if(values.length!==head.length)throw Error('CSV column mismatch: '+file+' line '+(i+2));
  return Object.fromEntries(head.map((key,j)=>[key,values[j]]));
 });
}
const code=process.argv[2],year=process.argv[3];
if(!code||!/^20[0-9]{2}$/.test(year))throw Error('Usage: node scripts/build-programme-preview.mjs <party-folder> <year> [--check]');
const dir=resolve('data/programmes',code,year);
const groups=csv(dir+'/groupes-citoyens.csv'),links=csv(dir+'/rattachements-citoyens.csv'),
      impacts=csv(dir+'/impacts-citoyens.csv'),
      measures=csv(dir+'/mesures.csv').filter(m=>m.origin==='documentary');
const sourceById=new Map(measures.map(m=>[m.measure_id,m]));
const owner=new Map(),seen=new Set();
for(const group of groups){
 for(const p of group.citizen_post_ids.split(';').filter(Boolean)){
  if(owner.has(p))throw Error('Post reserved by multiple groups: '+p);
  owner.set(p,group.group_id);
 }
}
for(const link of links){
 if(!sourceById.has(link.source_measure_id)||seen.has(link.source_measure_id))throw Error('Invalid source link: '+link.source_measure_id);
 seen.add(link.source_measure_id);
 for(const p of link.citizen_post_ids.split(';').filter(Boolean))
  if(owner.get(p)!==link.group_id)throw Error('Post/group inconsistency: '+p);
}
if(seen.size!==sourceById.size)throw Error('Some documentary measures are not mapped');
const output=groups.map(g=>{
 const lines=links.filter(l=>l.group_id===g.group_id).map(l=>{
  const m=sourceById.get(l.source_measure_id);
  return {id:Number(l.source_row),title:m.public_title||m.title,originalTitle:m.title,
   description:m.public_description||'',claimedAmountBn:Number(m.claimed_amount_bn),
   direction:m.direction,sourceUrl:m.source_url,sourcePage:Number(l.source_page)||null,
   impactDescription:m.public_description||m.impact_description||''};
 });
 if(lines.length!==Number(g.source_count))throw Error('Incorrect measure count in '+g.group_id);
 const citizenImpacts=impacts.filter(i=>i.group_id===g.group_id).map(i=>({
  side:i.citizen_side,categoryId:i.citizen_post_id,label:i.citizen_post_label,
  claimedAmountBn:i.claimed_post_amount_bn===''?null:Number(i.claimed_post_amount_bn),
  status:i.status,rationale:i.rationale,simulated:false
 }));
 return {id:g.group_id,title:g.title,description:g.description,sourceCount:Number(g.source_count),
  sourceUrl:g.source_url,claimedRevenueBn:g.claimed_revenues_bn===''?null:Number(g.claimed_revenues_bn),
  claimedExpenseBn:g.claimed_expenses_bn===''?null:Number(g.claimed_expenses_bn),
  citizenImpacts,sourceLines:lines};
});
const postCount=output.reduce((n,g)=>n+(g.citizenImpacts?.length||0),0);
if(postCount!==owner.size)throw Error('Incomplete impacts by post');
const dst=dir+'/preview-groups.json',content=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){
 if(readFileSync(dst,'utf8')!==content)throw Error('Preview fixture out of date: '+dst);
 console.log('OK: '+measures.length+' documentary measures, '+groups.length+' groups, '+owner.size+' exclusive posts');
}else{
 writeFileSync(dst,content);
 console.log('Generated '+dst+' from CSV source');
}
