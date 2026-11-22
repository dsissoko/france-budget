#!/usr/bin/env node
// Import party programmes from versioned CSV, including documentary measures for AGGREGATE budgets.
// Run: node scripts/import-programmes.mjs (dry run)
// Apply: DATABASE_URL=... node scripts/import-programmes.mjs --apply
import {readFileSync,existsSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';

function csv(file){
 const text=readFileSync(file,'utf8'),rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}
  else if(c===','&&!quoted){row.push(value);value=''}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(v=>v!==''))rows.push(row);row=[];value=''}
  else value+=c;
 }
 if(quoted)throw Error('CSV incomplete '+file);
 if(row.length||value){row.push(value);rows.push(row)}
 if(!rows.length)return [];
 const [head,...body]=rows;
 return body.map((values,i)=>{if(values.length!==head.length)throw Error('CSV columns '+file+' line '+(i+2));return Object.fromEntries(head.map((h,j)=>[h,values[j]]))});
}
const optionalCsv=(path)=>existsSync(path)?csv(path):[];
const reg=csv('data/programmes/registre-programmes.csv').filter(r=>r.actor_type==='party');
const latest=new Map();
for(const r of reg)if(!latest.has(r.party_code)||Number(latest.get(r.party_code).year)<Number(r.year))latest.set(r.party_code,r);
const plans=[...latest.values()].map(r=>{
 const themes=csv(r.themes_csv).filter(t=>t.status!=='historical_unsourced'),measures=csv(r.mesures_csv),aggregates=csv(r.agregats_csv),sources=csv(r.sources_csv);
 const dir='data/programmes/'+r.party_code.toLowerCase()+'/'+r.year+'/';
 const groups=optionalCsv(dir+'groupes-citoyens.csv'),links=optionalCsv(dir+'rattachements-citoyens.csv'),
       impacts=optionalCsv(dir+'impacts-citoyens.csv'),presentation=optionalCsv(dir+'presentation.csv');
 const primaryMeasures=measures.filter(x=>x.origin==='documentary');
 if(groups.length||links.length||impacts.length){
  if(!groups.length||!links.length||!impacts.length)
    throw Error('Incomplete citizen CSV inventory '+r.programme_id);
  const ids=new Set(),posts=new Map(),counts=new Map();
  for(const g of groups){
   if(ids.has(g.group_id))throw Error('Duplicate group '+g.group_id);
   ids.add(g.group_id);
   for(const post of g.citizen_post_ids.split(';').filter(Boolean)){
    if(posts.has(post))throw Error('Citizen post belongs to multiple groups: '+post);
    posts.set(post,g.group_id);
   }
  }
  const sourceIds=new Set(primaryMeasures.map(x=>x.measure_id));
  for(const l of links){
   if(!sourceIds.has(l.source_measure_id)||!ids.has(l.group_id))throw Error('Unknown documentary link '+l.source_measure_id);
   if(counts.has(l.source_measure_id))throw Error('Duplicated documentary measure '+l.source_measure_id);
   counts.set(l.source_measure_id,l.group_id);
   for(const post of l.citizen_post_ids.split(';').filter(Boolean))
    if(posts.get(post)!==l.group_id)throw Error('Post reservation mismatch '+post);
  }
  if(counts.size!==primaryMeasures.length)throw Error('Unmapped source rows '+r.programme_id);
  const impactPosts=new Set();
  for(const impact of impacts){
   if(!ids.has(impact.group_id)||posts.get(impact.citizen_post_id)!==impact.group_id)
    throw Error('Unknown citizen impact '+impact.citizen_post_id);
   if(impactPosts.has(impact.citizen_post_id))throw Error('Duplicate post impact '+impact.citizen_post_id);
   impactPosts.add(impact.citizen_post_id);
   if(!['true','false'].includes(impact.simulation_applied)||
      (impact.simulation_applied==='true'&&!Number.isFinite(Number(impact.claimed_post_amount_bn))))
     throw Error('Invalid aggregate allocation state or amount '+r.programme_id);
  }
  if(impactPosts.size!==posts.size)throw Error('Missing citizen impact rows '+r.programme_id);
  for(const g of groups)if(Number(g.source_count)!==links.filter(l=>l.group_id===g.group_id).length)
   throw Error('Incorrect source count '+g.group_id);
 }
 const a=aggregates.find(x=>x.revenues_bn!==''&&x.expenses_bn!=='');
 if(a&&(!Number.isFinite(Number(a.revenues_bn))||!Number.isFinite(Number(a.expenses_bn))||
 Math.abs(Number(a.revenues_bn)-Number(a.expenses_bn)-Number(a.balance_delta_bn))>0.011||
 !a.source_url.startsWith('https://')))throw Error('Unreconciled sourced amounts '+r.programme_id);
 for(const t of themes)if(t.party_code!==r.party_code||String(t.year)!==String(r.year)||!t.source_url.startsWith('https://'))throw Error('Invalid sourced theme '+r.programme_id);
 if(a&&groups.length){
  const rev=primaryMeasures.filter(x=>x.direction==='revenue_increase').reduce((sum,x)=>sum+Number(x.claimed_amount_bn),0);
  const exp=primaryMeasures.filter(x=>x.direction==='expense_increase').reduce((sum,x)=>sum+Number(x.claimed_amount_bn),0);
  if(Math.abs(rev-Number(a.revenues_bn))>0.011||Math.abs(exp-Number(a.expenses_bn))>0.011)
   throw Error('Detailed amounts differ from aggregate claims '+r.programme_id);
 }
 return {r,a,themes,measures,sources,groups,links,impacts,presentation,primaryMeasures};
});
console.log(JSON.stringify(plans.map(p=>({party:p.r.party_code,year:p.r.year,mode:p.a?'AGGREGATE':'PARTIAL',
 themes:p.themes.length,archivedMeasures:p.measures.length,documentaryMeasures:p.primaryMeasures.length,groups:p.groups.length,impactedPosts:p.impacts.length,sources:p.sources.length})),null,2));
if(!process.argv.includes('--apply')){console.log('DRY RUN: Neon unchanged');process.exit(0)}
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required');
const sql=neon(process.env.DATABASE_URL);
const query=(s,args=[])=>sql.query(s,args);
const arch=await query("SELECT to_regclass('public.issue92_archive_measures') IS NOT NULL AS ok");
if(!arch[0].ok)throw Error('Historical Neon backup missing');
const column=await query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' AND column_name='budget_mode'");
if(column[0].n!==1)throw Error('budget_mode migration missing');
for(const p of plans){
 const r=p.r,party=r.party_code,year=Number(r.year);
 if(!p.a&&!p.themes.length)continue; // no fabricated budgets or unsourced themes
 await query("INSERT INTO political_parties(code,name) VALUES ($1,$2) ON CONFLICT(code) DO NOTHING",[party,r.name]);
 const claim=p.a?{year,basis:p.a.basis,revenuesBn:Number(p.a.revenues_bn),expensesBn:Number(p.a.expenses_bn),
  balanceDeltaBn:Number(p.a.balance_delta_bn),sourceUrl:p.a.source_url,
  scope:p.a.scope,sourceSection:p.a.source_section,description:p.a.notes,
  ...(party==='EQX'?{reportedOverallBalanceDeltaBn:78,overallExplanation:'The party also claims 6.1 Md EUR activity effect and -1.5 Md EUR technical correction; direct aggregate pair gives 73.4 Md EUR.'}:{})
 }:null;
 // Distribute amounts *within* the claimed aggregates, never on top of them.
 // The residual is automatically kept in the accounting adjustment posts by the engine.
 const claimedAllocations=claim?p.impacts.filter(i=>i.simulation_applied==='true').map(i=>({
   side:i.citizen_side,categoryId:i.citizen_post_id,amount:Number(i.claimed_post_amount_bn)
 })):[];
 if(claimedAllocations.some(i=>!['revenues','expenses'].includes(i.side)||!i.categoryId||!Number.isFinite(i.amount)))
   throw Error('Invalid aggregate allocations '+r.programme_id);
 const scenario={budget:{revenues:{},expenses:{}},picked:[],...(claim?{claimedTotals:claim,claimedAllocations}:{documentaryOnly:true})};
 const title=r.name+' — '+(claim?'contre-budget':'propositions')+' '+year;
 const desc=p.presentation[0]?.description||(claim?'Deux masses financières déclarées et sourcées.':'Thèmes sourcés, mesures en cours de qualification.');
 const b=await query("SELECT id FROM budgets WHERE origin='party' AND party_code=$1 ORDER BY published_at DESC LIMIT 1",[party]);
 if(b.length) {
   await query("UPDATE budgets SET scenario=(scenario-'claimedTotals'-'documentaryOnly'-'claimedAllocations') || $1::jsonb,visibility='public',featured=$2,description=$3 WHERE id=$4",
   [JSON.stringify(claim?{picked:[],claimedTotals:claim,claimedAllocations}:{picked:[],documentaryOnly:true}),Boolean(claim),desc,b[0].id]);
 } else await query("INSERT INTO budgets(title,description,origin,party_code,reference_year,scenario,visibility,featured,maturity_status) VALUES($1,$2,'party',$3,2025,$4::jsonb,'public',$5,'en_preparation')",
   [title,desc,party,JSON.stringify(scenario),Boolean(claim)]);
 for(const t of p.themes)await query("INSERT INTO party_proposals(party_code,source_year,group_id,title,source_measure_count,review_status,source_url,description) VALUES($1,$2,$3,$4,0,'review_pending',$5,$6) ON CONFLICT(party_code,source_year,group_id) DO UPDATE SET title=EXCLUDED.title,source_measure_count=0,source_url=EXCLUDED.source_url,description=EXCLUDED.description",
  [party,year,t.theme_id,t.title,t.source_url,t.description]);
 // Source rows and grouped citizen impacts remain documentary in AGGREGATE mode.
 if(p.groups.length){
  const present=await query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND ((table_name='party_proposals' AND column_name='citizen_impacts') OR (table_name='party_source_lines' AND column_name='source_page'))");
  if(present.length!==2)throw Error('Apply db/migrations/20261122_party_citizen_import_fields.sql before importing citizen groups');
  const bySource=new Map(p.primaryMeasures.map(m=>[m.measure_id,m]));
  const byGroup=new Map();
  for(const impact of p.impacts){
   const list=byGroup.get(impact.group_id)||[];
   list.push({side:impact.citizen_side,categoryId:impact.citizen_post_id,label:impact.citizen_post_label,
    claimedAmountBn:impact.claimed_post_amount_bn===''?null:Number(impact.claimed_post_amount_bn),
    status:impact.status,rationale:impact.rationale,simulated:false});
   byGroup.set(impact.group_id,list);
  }
  for(const g of p.groups)await query(
   "INSERT INTO party_proposals(party_code,source_year,group_id,title,source_measure_count,review_status,source_url,description,citizen_impacts) VALUES($1,$2,$3,$4,$5,'review_pending',$6,$7,$8::jsonb) ON CONFLICT(party_code,source_year,group_id) DO UPDATE SET title=EXCLUDED.title,source_measure_count=EXCLUDED.source_measure_count,source_url=EXCLUDED.source_url,description=EXCLUDED.description,citizen_impacts=EXCLUDED.citizen_impacts",
   [party,year,g.group_id,g.title,Number(g.source_count),g.source_url,g.description,JSON.stringify(byGroup.get(g.group_id)||[])]
  );
  for(const l of p.links){
   const m=bySource.get(l.source_measure_id);
   const page=Number(l.source_page)||null;
   await query(
    "INSERT INTO party_source_lines(party_code,source_year,source_row,group_id,direction,title,claimed_amount_bn,source_url,validation_status,impact_description,source_page) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(party_code,source_year,source_row) DO UPDATE SET group_id=EXCLUDED.group_id,direction=EXCLUDED.direction,title=EXCLUDED.title,claimed_amount_bn=EXCLUDED.claimed_amount_bn,source_url=EXCLUDED.source_url,validation_status=EXCLUDED.validation_status,impact_description=EXCLUDED.impact_description,source_page=EXCLUDED.source_page",
    [party,year,Number(l.source_row),l.group_id,m.direction,m.public_title||m.title,Number(m.claimed_amount_bn),m.source_url,m.source_status,m.public_description||m.impact_description||'',page]
   );
  }
 }
 const actual=await query("SELECT budget_mode::text AS mode FROM budgets WHERE origin='party' AND party_code=$1 ORDER BY published_at DESC LIMIT 1",[party]);
 if(actual[0].mode!==(claim?'AGGREGATE':'PARTIAL'))throw Error('Unexpected mode '+party);
}
console.log('CSV import completed; documentary lines imported independently of AGGREGATE accounting.');
