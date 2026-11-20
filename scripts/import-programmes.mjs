#!/usr/bin/env node
// Reimport party themes and sourced aggregate pairs from versioned CSV only.
// Run: node scripts/import-programmes.mjs (dry run)
// Apply: DATABASE_URL=... node scripts/import-programmes.mjs --apply
import {readFileSync} from 'node:fs';
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
const reg=csv('data/programmes/registre-programmes.csv').filter(r=>r.actor_type==='party');
const latest=new Map();
for(const r of reg)if(!latest.has(r.party_code)||Number(latest.get(r.party_code).year)<Number(r.year))latest.set(r.party_code,r);
const plans=[...latest.values()].map(r=>{
 const themes=csv(r.themes_csv),measures=csv(r.mesures_csv),aggregates=csv(r.agregats_csv),sources=csv(r.sources_csv);
 const a=aggregates.find(x=>x.revenues_bn!==''&&x.expenses_bn!=='');
 if(a&&(!Number.isFinite(Number(a.revenues_bn))||!Number.isFinite(Number(a.expenses_bn))||
 Math.abs(Number(a.revenues_bn)-Number(a.expenses_bn)-Number(a.balance_delta_bn))>0.011||
 !a.source_url.startsWith('https://')))throw Error('Unreconciled sourced amounts '+r.programme_id);
 for(const t of themes)if(t.party_code!==r.party_code||String(t.year)!==String(r.year)||!t.source_url.startsWith('https://'))throw Error('Invalid sourced theme '+r.programme_id);
 return {r,a,themes,measures,sources};
});
console.log(JSON.stringify(plans.map(p=>({party:p.r.party_code,year:p.r.year,mode:p.a?'AGGREGATE':'PARTIAL',
 themes:p.themes.length,archivedMeasures:p.measures.length,sources:p.sources.length})),null,2));
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
 if(!p.a&&!p.themes.length)continue; // no fabricated budgets
 await query("INSERT INTO political_parties(code,name) VALUES ($1,$2) ON CONFLICT(code) DO NOTHING",[party,r.name]);
 const claim=p.a?{year,basis:p.a.basis,revenuesBn:Number(p.a.revenues_bn),expensesBn:Number(p.a.expenses_bn),
  balanceDeltaBn:Number(p.a.balance_delta_bn),sourceUrl:p.a.source_url,
  scope:p.a.scope,sourceSection:p.a.source_section,description:p.a.notes,
  ...(party==='EQX'?{reportedOverallBalanceDeltaBn:78,overallExplanation:'The party also claims 6.1 Md EUR activity effect and -1.5 Md EUR technical correction; direct aggregate pair gives 73.4 Md EUR.'}:{})
 }:null;
 const scenario={budget:{revenues:{},expenses:{}},picked:[],...(claim?{claimedTotals:claim}:{documentaryOnly:true})};
 const title=r.name+' — '+(claim?'contre-budget':'propositions')+' '+year;
 const desc=claim?'Deux masses financières déclarées et sourcées, sans mesures comptables individuelles.':'Thèmes sourcés, aucune mesure financière exploitable à ce stade.';
 const b=await query("SELECT id FROM budgets WHERE origin='party' AND party_code=$1 ORDER BY published_at DESC LIMIT 1",[party]);
 if(b.length) {
   await query("UPDATE budgets SET scenario=(scenario-'claimedTotals'-'documentaryOnly') || $1::jsonb,visibility='public',featured=$2,description=$3 WHERE id=$4",
   [JSON.stringify(claim?{picked:[],claimedTotals:claim}:{picked:[],documentaryOnly:true}),Boolean(claim),desc,b[0].id]);
 } else await query("INSERT INTO budgets(title,description,origin,party_code,reference_year,scenario,visibility,featured,maturity_status) VALUES($1,$2,'party',$3,2025,$4::jsonb,'public',$5,'en_preparation')",
   [title,desc,party,JSON.stringify(scenario),Boolean(claim)]);
 for(const t of p.themes)await query("INSERT INTO party_proposals(party_code,source_year,group_id,title,source_measure_count,review_status,source_url,description) VALUES($1,$2,$3,$4,0,'review_pending',$5,$6) ON CONFLICT(party_code,source_year,group_id) DO UPDATE SET title=EXCLUDED.title,source_measure_count=0,source_url=EXCLUDED.source_url,description=EXCLUDED.description",
  [party,year,t.theme_id,t.title,t.source_url,t.description]);
 const actual=await query("SELECT budget_mode::text AS mode FROM budgets WHERE origin='party' AND party_code=$1 ORDER BY published_at DESC LIMIT 1",[party]);
 if(actual[0].mode!==(claim?'AGGREGATE':'PARTIAL'))throw Error('Unexpected mode '+party);
}
console.log('CSV import completed; no individual AGGREGATE measures inserted.');
