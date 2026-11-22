#!/usr/bin/env node
// V2-only transactional bootstrap from versioned data; dry run unless --apply.
// Uses psql installed on the operator machine. Never uses DATABASE_URL.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'../..');
const read=(file)=>readFileSync(resolve(root,file),'utf8');
const q=(v)=>v==null?'NULL':"'"+String(v).replaceAll("'","''")+"'";
const dec=(v)=>/^-?\d+(?:\.\d{1,3})?$/.test(String(v));
const n=(v)=>{if(!dec(v))throw Error('Invalid decimal '+v);return String(v)};
const int=(v)=>Number.isSafeInteger(Number(v));

export function validateFixture(d){
 if(d.format!=='mon-budget-citoyen-v2-reference/v1'||d.referenceYear!==2025||
  !Array.isArray(d.posts)||d.posts.length!==27||!d.parameters)throw Error('Invalid reference fixture');
 const keys=new Set(),counts={revenues:0,expenses:0,offBudget:0};
 for(const p of d.posts){
  if(p.reference_year!==2025||!Object.hasOwn(counts,p.side)||!p.category_id||
   !p.label||!p.canonical||!p.description||!dec(p.amount_bn)||!int(p.sort_order))
    throw Error('Invalid post '+p.category_id);
  const key=p.side+':'+p.category_id;
  if(keys.has(key))throw Error('Duplicate post '+key);
  keys.add(key);counts[p.side]++;
  if(p.side==='offBudget'&&!p.revenue_impact_category)throw Error('Off-budget mapping missing');
 }
 if(counts.revenues!==10||counts.expenses!==15||counts.offBudget!==2)
  throw Error('Invalid distribution '+JSON.stringify(counts));
 const p=d.parameters;
 if(p.reference_year!==2025||!p.reference_version||
  ![p.baseline_rate_per_index,p.balance_threshold,p.change_threshold,p.momentum_threshold].every(dec)||
  ![p.budget_year,p.application_year,p.horizon_year].every(int))
   throw Error('Invalid parameters');
 const sum=side=>d.posts.filter(x=>x.side===side).reduce((a,x)=>a+Math.round(Number(x.amount_bn)*1000),0);
 if(sum('revenues')!==1561700||sum('expenses')!==1714200)
  throw Error('2025 APU totals mismatch');
 return counts;
}

export function seedSql(d){
 validateFixture(d);
 const cols='reference_year,side,category_id,label,reference_amount_bn,canonical,description,sort_order,revenue_impact_category,source_year';
 const values=d.posts.map(p=>'('+[p.reference_year,q(p.side),q(p.category_id),
  q(p.label),n(p.amount_bn),q(p.canonical),q(p.description),p.sort_order,
  q(p.revenue_impact_category),p.source_year??'NULL'].join(',')+')').join(',\n');
 const p=d.parameters;
 const param=[p.reference_year,q(p.reference_version),n(p.baseline_rate_per_index),
  p.budget_year,p.application_year,p.horizon_year,n(p.balance_threshold),
  n(p.change_threshold),n(p.momentum_threshold)].join(',');
 return 'INSERT INTO v2.reference_posts('+cols+') VALUES\n'+values+
  '\nON CONFLICT(reference_year,side,category_id) DO NOTHING;\n'+
  'INSERT INTO v2.reference_parameters(reference_year,reference_version,baseline_rate_per_index,budget_year,application_year,horizon_year,balance_threshold,change_threshold,momentum_threshold) VALUES ('+
  param+') ON CONFLICT(reference_year) DO NOTHING;\n'+
  "DO $$ BEGIN IF (SELECT count(*) FROM v2.reference_posts WHERE reference_year=2025)<>27 THEN RAISE EXCEPTION 'missing_reference_posts'; END IF; END $$;\n";
}

export function bootstrapSql(d){
 const guard="DO $guard$ BEGIN IF to_regclass('v2.budgets') IS NOT NULL THEN IF EXISTS(SELECT 1 FROM v2.budgets) THEN RAISE EXCEPTION 'db:init refuses nonempty v2.budgets'; END IF; END IF; END $guard$;";
 const parts=['db/v2/001_schema.sql','db/v2/003_citizen_crud.sql',
  'db/v2/004_votes.sql','db/v2/initial_ui.sql'];
 return 'BEGIN;\n'+guard+'\n'+parts.map(read).join('\n')+'\n'+seedSql(d)+'COMMIT;\n';
}

async function main(){
 const args=process.argv.slice(2),apply=args.includes('--apply');
 if(args.some(a=>!['--apply','--confirm-empty-v2'].includes(a)))
  throw Error('Usage: npm run db:init -- [--apply --confirm-empty-v2]');
 const data=JSON.parse(read('data/reference/2025-v2.json'));
 const counts=validateFixture(data);
 if(!apply){
  console.log(JSON.stringify({dryRun:true,referenceYear:2025,
    posts:data.posts.length,counts,productionWrites:false},null,2));
  return;
 }
 if(!args.includes('--confirm-empty-v2'))throw Error('--confirm-empty-v2 required');
 if(!process.env.V2_DATABASE_URL)throw Error('V2_DATABASE_URL required');
 const result=spawnSync('psql',['-X','--set=ON_ERROR_STOP=1','--quiet'],{
  input:bootstrapSql(data),encoding:'utf8',
  env:{...process.env,PGDATABASE:process.env.V2_DATABASE_URL},maxBuffer:2*1024*1024
 });
 if(result.error)throw result.error;
 if(result.status!==0){
  process.stderr.write(result.stderr||'psql failed');
  throw Error('V2 initialization rolled back');
 }
 console.log('V2 schema initialized. V1 public remains unchanged.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(e=>{console.error(e.message);process.exitCode=1});
