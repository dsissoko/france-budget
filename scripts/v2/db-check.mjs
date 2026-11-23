#!/usr/bin/env node
// Read-only V2 reference and imported CSV concordance check.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateFixture} from './db-init.mjs';
import {loadBatch} from './import.mjs';
const root=resolve(import.meta.dirname,'../..');
const fixture=JSON.parse(readFileSync(join(root,'data/reference/2025-v2.json'),'utf8'));
const posts=fixture.posts;
const batches=[];
for(const part of readdirSync(join(root,'data/programmes'),{withFileTypes:true}).filter(x=>x.isDirectory()))
 for(const year of readdirSync(join(root,'data/programmes',part.name),{withFileTypes:true}).filter(x=>x.isDirectory())){
  const dir=join(root,'data/programmes',part.name,year.name);
  if(existsSync(join(dir,'budget.csv')))batches.push(loadBatch(dir));
 }
validateFixture(fixture);
if(!batches.length)throw Error('No CSV budgets found');
console.log(JSON.stringify({fixturePosts:posts.length,csvBudgets:batches.length,
 csvProposals:batches.reduce((a,b)=>a+b.proposals.length,0),
 csvMeasures:batches.reduce((a,b)=>a+b.measures.length,0),
 csvImpacts:batches.reduce((a,b)=>a+b.impacts.length,0)},null,2));
const live=process.argv.includes('--live');
if(process.argv.some(a=>a!=='--live'))throw Error('Usage: npm run db:check -- [--live]');
if(live){
 if(!process.env.V2_DATABASE_URL)throw Error('V2_DATABASE_URL required');
 const {neon}=await import('@neondatabase/serverless');
 const sql=neon(process.env.V2_DATABASE_URL);
 const actual=await sql.query("SELECT reference_year,side,category_id,label,reference_amount_bn::text AS amount_bn,canonical,description,sort_order,revenue_impact_category,source_year FROM v2.reference_posts ORDER BY reference_year,side,sort_order,category_id");
 for(const p of posts){
  const match=actual.find(a=>a.reference_year===p.reference_year&&a.side===p.side&&a.category_id===p.category_id);
  if(!match||Object.keys(p).some(k=>String(match[k]??'')!==String(p[k]??'')))
   throw Error('Reference fixture mismatch '+p.side+':'+p.category_id);
 }
 if(actual.length!==posts.length)throw Error('Unexpected reference count '+actual.length);
 const params=await sql.query("SELECT reference_year,reference_version,baseline_rate_per_index::text AS baseline_rate_per_index,budget_year,application_year,horizon_year,balance_threshold::text AS balance_threshold,change_threshold::text AS change_threshold,momentum_threshold::text AS momentum_threshold FROM v2.reference_parameters WHERE reference_year=2025");
 if(params.length!==1||Object.keys(fixture.parameters).some(k=>String(params[0][k])!==String(fixture.parameters[k])))
   throw Error('Reference parameter mismatch');
 const state=await sql.query("SELECT b.budget_key,b.version, (SELECT count(*)::int FROM v2.budget_proposals p WHERE p.budget_id=b.id) AS proposals,(SELECT count(*)::int FROM v2.budget_measures m WHERE m.budget_id=b.id) AS measures,(SELECT count(*)::int FROM v2.budget_impacts i WHERE i.budget_id=b.id) AS impacts FROM v2.budgets b");
 for(const b of batches){
  const row=state.find(x=>x.budget_key===b.budget.budget_key&&x.version===b.budget.version);
  if(!row||row.proposals!==b.proposals.length||row.measures!==b.measures.length||row.impacts!==b.impacts.length)
   throw Error('CSV/database count mismatch '+b.budget.budget_key);
 }
 const functions=await sql.query("SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='v2'");
 const available=new Set(functions.map(f=>f.proname));
 for(const name of ['import_budget','write_citizen_budget','refresh_featured_citizen_budget','refresh_featured_citizen_budget_trigger'])
  if(!available.has(name))throw Error('Missing V2 function '+name);
 const triggers=await sql.query("SELECT tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='v2' AND NOT t.tgisinternal");
 const triggerNames=new Set(triggers.map(t=>t.tgname));
 for(const name of ['trg_refresh_featured_citizen_votes','trg_refresh_featured_citizen_budgets'])
  if(!triggerNames.has(name))throw Error('Missing V2 trigger '+name);
 console.log('PASS: V2 reference, CSV inventories, functions and triggers concordant.');
} else console.log('DRY RUN: no database accessed. Pass --live to verify Neon.');
