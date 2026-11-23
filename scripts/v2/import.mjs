#!/usr/bin/env node
// V2 importer: mechanical CSV -> v2.import_budget(jsonb). Never writes to V1.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function readCsv(content) {
  const rows=[]; let row=[],value='',quoted=false;
  for(let i=0;i<content.length;i++){
    const c=content[i];
    if(c==='"'){if(quoted&&content[i+1]==='"'){value+='"';i++}else quoted=!quoted}
    else if(c===','&&!quoted){row.push(value);value=''}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&content[i+1]==='\n')i++;row.push(value);if(row.some(v=>v!==''))rows.push(row);row=[];value=''}
    else value+=c;
  }
  if(quoted)throw Error('CSV with unterminated quote');
  if(row.length||value){row.push(value);rows.push(row)}
  if(!rows.length)throw Error('CSV requires header');
  const [headers,...data]=rows;
  if(headers.length!==new Set(headers).size)throw Error('Duplicate CSV header');
  return data.map((fields,index)=>{
    if(fields.length!==headers.length)throw Error('CSV column count mismatch at row '+(index+2));
    return Object.fromEntries(headers.map((header,i)=>[header,fields[i]]));
  });
}
const decimal=/^-?\d+(?:\.\d{1,3})?$/;
function required(x,key,ctx){if(!String(x[key]??'').trim())throw Error(ctx+': missing '+key)}
function num(value,ctx){if(value!==''&&!decimal.test(value))throw Error(ctx+': invalid amount '+value)}
const sides=new Set(['revenues','expenses','offBudget']);
export function validateBatch(budget,proposals,impacts,measures=[]) {
  for(const key of ['budget_key','version','title','origin','reference_year'])required(budget,key,'budget');
  if(!['citizen','party','educational'].includes(budget.origin))throw Error('Invalid origin');
  if(!['','PARTIAL','AGGREGATE'].includes(budget.budget_mode??''))throw Error('Invalid mode');
  if(!/^\d{4}$/.test(budget.reference_year))throw Error('Invalid reference_year');
  if(budget.party_code===''&&budget.origin==='party')throw Error('Party code required');
  const keys=new Set(),measureKeys=new Set(),posts=new Set();
  for(const p of proposals){
    for(const key of ['proposal_key','title'])required(p,key,'proposal');
    if(p.budget_key!==budget.budget_key)throw Error('Proposal budget mismatch');
    if(keys.has(p.proposal_key))throw Error('Duplicate proposal '+p.proposal_key);
    keys.add(p.proposal_key);
  }
  for(const m of measures){
    for(const key of ['measure_key','proposal_key','title'])required(m,key,'measure');
    if(m.budget_key!==budget.budget_key||!keys.has(m.proposal_key))
      throw Error('Orphan measure '+m.measure_key);
    if(measureKeys.has(m.measure_key))throw Error('Duplicate measure '+m.measure_key);
    measureKeys.add(m.measure_key);
    num(m.claimed_amount_bn??'','measure '+m.measure_key);
    if(m.source_url&&!/^https?:\/\//.test(m.source_url))throw Error('Invalid source URL '+m.measure_key);
  }
  for(const i of impacts){
    if(i.budget_key!==budget.budget_key||!keys.has(i.proposal_key))throw Error('Orphan impact');
    if(!sides.has(i.side)||!i.category_id)throw Error('Invalid pivot post');
    if(!decimal.test(i.delta_amount_bn??'')||Number(i.delta_amount_bn)===0)
      throw Error('Invalid impact amount');
    const key=i.side+':'+i.category_id;
    if(posts.has(key))throw Error('Duplicate impact post '+key);
    posts.add(key);
    if(!proposals.find(p=>p.proposal_key===i.proposal_key)?.description?.trim())
      throw Error('Impacted proposal requires a documented description: '+i.proposal_key);
  }
  // The qualification skill may consolidate multiple source measures into one proposal.
  // Measures marked grouped_into_pivot must reconcile with one qualified impact.
  const grouped=measures.filter(m=>m.source_status==='grouped_into_pivot');
  for(const proposalKey of new Set(grouped.map(m=>m.proposal_key))){
    const members=grouped.filter(m=>m.proposal_key===proposalKey);
    const booked=impacts.filter(i=>i.proposal_key===proposalKey);
    if(booked.length!==1)throw Error('Pivot group requires exactly one impact '+proposalKey);
    const sum=members.reduce((n,m)=>n+Math.round(Number(m.claimed_amount_bn)*1000),0);
    if(sum!==Math.round(Number(booked[0].delta_amount_bn)*1000))
      throw Error('Pivot group sum mismatch '+proposalKey);
  }
  let documentary={};
  if(budget.documentary_json){
    try{documentary=JSON.parse(budget.documentary_json)}
    catch {throw Error('Invalid documentary_json')}
    if(!documentary||Array.isArray(documentary)||typeof documentary!=='object')
      throw Error('documentary_json must be an object');
  }
  return {budget:{...budget,documentary},proposals,measures,impacts};
}

/** Optional richer citizen grouping inventory, produced upstream by the qualification skill.
 * Applies to both party and citizen CSV contracts as documentary metadata, never as
 * standalone additive proposal impacts. All relationships are checked deterministically.
 */
export function enrichCitizenGroups(directory,batch){
 const names=['groupes-citoyens.csv','rattachements-citoyens.csv','impacts-citoyens.csv'];
 const files=names.map(n=>join(directory,n));
 if(files.every(p=>!existsSync(p)))return batch;
 if(files.some(p=>!existsSync(p)))throw Error('Incomplete citizen grouping CSVs: '+directory);
 const [groups,links,impacts]=files.map(p=>readCsv(readFileSync(p,'utf8')));
 const bySource=new Map(batch.measures.map(m=>[m.measure_key,m]));
 const ids=new Set(),reserved=new Map(),mapped=new Set();
 const split=s=>String(s??'').split(';').filter(Boolean);
 for(const g of groups){
  if(ids.has(g.group_id))throw Error('Duplicate citizen group '+g.group_id);
  ids.add(g.group_id);
  for(const post of split(g.citizen_post_ids)){
   if(reserved.has(post))throw Error('Citizen post reserved by multiple groups: '+post);
   reserved.set(post,g.group_id);
  }
 }
 for(const l of links){
  if(!ids.has(l.group_id)||!bySource.has(l.source_measure_id)||
     mapped.has(l.source_measure_id))throw Error('Unmatched or duplicate source link '+l.source_measure_id);
  mapped.add(l.source_measure_id);
  for(const post of split(l.citizen_post_ids))
   if(reserved.get(post)!==l.group_id)throw Error('Source links wrong post '+post);
 }
 if(mapped.size!==bySource.size)throw Error('Citizen groups do not cover every source measure');
 const impactPosts=new Set(),claimedAllocations=[];
 for(const i of impacts){
  if(!ids.has(i.group_id)||reserved.get(i.citizen_post_id)!==i.group_id)
   throw Error('Invalid impact group or post '+i.citizen_post_id);
  if(impactPosts.has(i.citizen_post_id))throw Error('Repeated citizen impact post '+i.citizen_post_id);
  impactPosts.add(i.citizen_post_id);
  const on=i.simulation_applied==='true';
  if(!['true','false'].includes(i.simulation_applied)||
      !['revenues','expenses'].includes(i.citizen_side)||
      (on&&(!decimal.test(i.claimed_post_amount_bn)||Number(i.claimed_post_amount_bn)<=0)))
   throw Error('Invalid grouped citizen impact '+i.citizen_post_id);
  if(on)claimedAllocations.push({side:i.citizen_side,categoryId:i.citizen_post_id,
    amount:Number(i.claimed_post_amount_bn)});
 }
 if(impactPosts.size!==reserved.size)throw Error('Missing citizen post impact');
 const citizenGroups=groups.map(g=>{
  const linked=links.filter(l=>l.group_id===g.group_id);
  const sourceIds=split(g.source_measure_ids);
  if(linked.length!==Number(g.source_count)||sourceIds.length!==linked.length||
     linked.some(l=>!sourceIds.includes(l.source_measure_id)))
    throw Error('Incorrect source links/count '+g.group_id);
  const sourceLines=linked.map(l=>{
   const p=bySource.get(l.source_measure_id);
   return {id:l.source_measure_id,title:p.title,description:p.description||'',
    claimedAmountBn:Number(p.claimed_amount_bn),direction:p.direction,
    sourceUrl:p.source_url,sourcePage:Number(l.source_page)||null,
    sourceStatus:p.source_status,impactDescription:l.rationale};
  });
  return {id:g.group_id,title:g.title,description:g.description,
   sourceUrl:g.source_url,sourceCount:Number(g.source_count),sourceLines,
   citizenImpacts:impacts.filter(i=>i.group_id===g.group_id).map(i=>({
    side:i.citizen_side,categoryId:i.citizen_post_id,label:i.citizen_post_label,
    claimedAmountBn:i.claimed_post_amount_bn===''?null:Number(i.claimed_post_amount_bn),
    status:i.status,rationale:i.rationale,simulated:i.simulation_applied==='true'
   }))};
 });
 const aggregate=batch.budget.documentary?.aggregates?.[0];
 if(!aggregate||batch.budget.budget_mode!=='AGGREGATE')
  throw Error('Grouped citizen allocations require declared AGGREGATE');
 const sum=side=>claimedAllocations.filter(a=>a.side===side).reduce((n,a)=>n+a.amount,0);
 if(sum('revenues')>Number(aggregate.revenues_bn)+.011||
    sum('expenses')>Number(aggregate.expenses_bn)+.011)
  throw Error('Citizen allocations exceed declared aggregates');
 const presentationFile=join(directory,'presentation.csv');
 if(existsSync(presentationFile)){
  const p=readCsv(readFileSync(presentationFile,'utf8'));
  if(p.length!==1||p[0].party_code!==batch.budget.party_code)
   throw Error('Invalid citizen presentation CSV');
  batch.budget.description=p[0].description;
 }
 batch.budget.documentary={...batch.budget.documentary,citizenGroups,claimedAllocations};
 return batch;
}

export function loadBatch(directory){
  const read=name=>readCsv(readFileSync(join(directory,name),'utf8'));
  const budgets=read('budget.csv');
  if(budgets.length!==1)throw Error(directory+': exactly one budget required');
  return enrichCitizenGroups(directory,validateBatch(budgets[0],read('proposals.csv'),read('impacts.csv'),read('measures.csv')));
}
function discover(base) {
  const found=[];
  for(const p of readdirSync(base,{withFileTypes:true}).filter(x=>x.isDirectory()))
    for(const y of readdirSync(join(base,p.name),{withFileTypes:true}).filter(x=>x.isDirectory())) {
      const dir=join(base,p.name,y.name);
      if(existsSync(join(dir,'budget.csv')))found.push(dir);
    }
  return found.sort();
}
async function main(){
  const args=process.argv.slice(2),apply=args.includes('--apply');
  const dirs=args.includes('--all')?discover(resolve('data/programmes')):args.filter(x=>!x.startsWith('--')).map(x=>resolve(x));
  if(!dirs.length)throw Error('Usage: node scripts/v2/import.mjs --all [--apply] OR <directory> [--apply]');
  const batches=dirs.map(loadBatch);
  const seen=new Set();
  for(const b of batches){const k=b.budget.budget_key+':'+b.budget.version;if(seen.has(k))throw Error('Duplicate batch '+k);seen.add(k)}
  let sql;
  if(apply) {
    if(!process.env.V2_DATABASE_URL)throw Error('V2_DATABASE_URL required: never fallback to DATABASE_URL');
    const {neon}=await import('@neondatabase/serverless');
    sql=neon(process.env.V2_DATABASE_URL);
    const schemas=await sql.query("SELECT to_regprocedure('v2.import_budget(jsonb)') IS NOT NULL AS ready");
    if(!schemas[0]?.ready)throw Error('V2 schema unavailable');
  }
  for(const batch of batches){
    const meta={budget_key:batch.budget.budget_key,version:batch.budget.version,origin:batch.budget.origin,proposals:batch.proposals.length,measures:batch.measures.length,impacts:batch.impacts.length,sources:batch.budget.documentary.sources?.length??0,aggregates:batch.budget.documentary.aggregates?.length??0};
    if(apply){const rows=await sql.query('SELECT v2.import_budget($1::jsonb) AS id',[JSON.stringify(batch)]);console.log(JSON.stringify({...meta,id:rows[0].id,imported:true}))}
    else console.log(JSON.stringify({...meta,dryRun:true}));
  }
  if(!apply)console.log('DRY RUN: no database writes');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main().catch(e=>{console.error(e.message);process.exitCode=1});
