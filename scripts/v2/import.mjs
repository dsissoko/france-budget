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
export function validateBatch(budget,proposals,impacts) {
  for(const key of ['budget_key','version','title','origin','reference_year'])required(budget,key,'budget');
  if(!['citizen','party','educational'].includes(budget.origin))throw Error('Invalid origin');
  if(!['','PARTIAL','AGGREGATE'].includes(budget.budget_mode??''))throw Error('Invalid mode');
  if(!/^\d{4}$/.test(budget.reference_year))throw Error('Invalid reference_year');
  if(budget.party_code===''&&budget.origin==='party')throw Error('Party code required');
  const keys=new Set(),posts=new Set();
  for(const p of proposals){
    for(const key of ['proposal_key','title'])required(p,key,'proposal');
    if(p.budget_key!==budget.budget_key)throw Error('Proposal budget mismatch');
    if(keys.has(p.proposal_key))throw Error('Duplicate proposal '+p.proposal_key);
    keys.add(p.proposal_key);
    num(p.claimed_amount_bn??'','proposal '+p.proposal_key);
    if(p.source_url&&!/^https?:\/\//.test(p.source_url))throw Error('Invalid source URL '+p.proposal_key);
  }
  for(const i of impacts){
    if(i.budget_key!==budget.budget_key||!keys.has(i.proposal_key))throw Error('Orphan impact');
    if(!sides.has(i.side)||!i.category_id)throw Error('Invalid pivot post');
    if(!decimal.test(i.delta_amount_bn??'')||Number(i.delta_amount_bn)===0)throw Error('Invalid impact amount');
    const key=i.side+':'+i.category_id;
    if(posts.has(key))throw Error('Duplicate impact post '+key);
    posts.add(key);
    if(!proposals.find(p=>p.proposal_key===i.proposal_key)?.description?.trim())
      throw Error('Impacted proposal requires a documented description: '+i.proposal_key);
  }
  // Deterministic pivot grouping: retain source measures, validate their additive
  // contributions, and persist exactly one impact per citizen budget post.
  const groupedSources=new Set();
  for(const group of proposals.filter(p=>p.source_origin==='pivot_consolidation')){
    const match=/^members=([a-zA-Z0-9_.-]+:-?\d+(?:\.\d{1,3})?)(\|[a-zA-Z0-9_.-]+:-?\d+(?:\.\d{1,3})?)*$/.exec(group.notes??'');
    if(!match)throw Error('Invalid pivot group members '+group.proposal_key);
    const members=group.notes.slice(8).split('|').map(part=>{
      const cut=part.lastIndexOf(':');
      return {key:part.slice(0,cut),amount:part.slice(cut+1)};
    });
    if(members.length<2)throw Error('Pivot group requires multiple source measures: '+group.proposal_key);
    const groupImpacts=impacts.filter(i=>i.proposal_key===group.proposal_key);
    if(groupImpacts.length!==1)throw Error('Pivot group requires exactly one impact '+group.proposal_key);
    const destination=groupImpacts[0];
    const sourceDirection=destination.side==='revenues'?'revenue_increase':destination.side==='expenses'?'expense_increase':null;
    if(!sourceDirection||group.direction!==sourceDirection)
      throw Error('Pivot group direction does not match accounting side '+group.proposal_key);
    let totalMilli=0;
    for(const member of members){
      const source=proposals.find(p=>p.proposal_key===member.key);
      if(!source||source.source_origin==='pivot_consolidation'||groupedSources.has(member.key))
        throw Error('Invalid or repeated pivot group source '+member.key);
      if(source.source_status!=='grouped_into_pivot'||source.direction!==group.direction||
         source.source_year!==group.source_year||source.source_url!==group.source_url)
        throw Error('Pivot member not traceable to group '+member.key);
      if(!decimal.test(member.amount)||source.claimed_amount_bn!==member.amount)
        throw Error('Pivot member amount differs from source '+member.key);
      groupedSources.add(member.key);
      totalMilli+=Math.round(Number(member.amount)*1000);
      if(impacts.some(i=>i.proposal_key===member.key))
        throw Error('Pivot source is also directly impacted '+member.key);
    }
    if(totalMilli!==Math.round(Number(destination.delta_amount_bn)*1000))
      throw Error('Pivot group sum mismatch '+group.proposal_key);
  }
  for(const p of proposals.filter(p=>p.source_status==='grouped_into_pivot')){
    if(!groupedSources.has(p.proposal_key))throw Error('Unlinked pivot source '+p.proposal_key);
  }
  let documentary={};
  if(budget.documentary_json){
    try{documentary=JSON.parse(budget.documentary_json)}
    catch {throw Error('Invalid documentary_json')}
    if(!documentary||Array.isArray(documentary)||typeof documentary!=='object')
      throw Error('documentary_json must be an object');
  }
  return {budget:{...budget,documentary},proposals,impacts};
}
export function loadBatch(directory){
  const read=name=>readCsv(readFileSync(join(directory,name),'utf8'));
  const budgets=read('budget.csv');
  if(budgets.length!==1)throw Error(directory+': exactly one budget required');
  return validateBatch(budgets[0],read('proposals.csv'),read('impacts.csv'));
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
    const meta={budget_key:batch.budget.budget_key,version:batch.budget.version,origin:batch.budget.origin,proposals:batch.proposals.length,impacts:batch.impacts.length,sources:batch.budget.documentary.sources?.length??0,aggregates:batch.budget.documentary.aggregates?.length??0};
    if(apply){const rows=await sql.query('SELECT v2.import_budget($1::jsonb) AS id',[JSON.stringify(batch)]);console.log(JSON.stringify({...meta,id:rows[0].id,imported:true}))}
    else console.log(JSON.stringify({...meta,dryRun:true}));
  }
  if(!apply)console.log('DRY RUN: no database writes');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main().catch(e=>{console.error(e.message);process.exitCode=1});
