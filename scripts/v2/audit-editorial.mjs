#!/usr/bin/env node
// Editorial quality report only. Never rewrites source CSV, amounts, or documentation.
import {readdirSync,existsSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {loadBatch} from './import.mjs';

const MAX_TITLE=100;
const MAX_DESCRIPTION=360;
const rows=[];
for(const actor of readdirSync(resolve('data/programmes'),{withFileTypes:true}).filter(x=>x.isDirectory())){
  for(const year of readdirSync(join('data/programmes',actor.name),{withFileTypes:true}).filter(x=>x.isDirectory())){
    const directory=join('data/programmes',actor.name,year.name);
    if(!existsSync(join(directory,'budget.csv')))continue;
    const {budget,proposals,impacts}=loadBatch(directory);
    const withImpact=new Set(impacts.map(x=>x.proposal_key));
    const issues=[];
    for(const p of proposals){
      const ctx={proposal_key:p.proposal_key,title:p.title};
      if(!p.description?.trim())issues.push({...ctx,code:'DESCRIPTION_MISSING',severity:'review'});
      if(p.description?.length>MAX_DESCRIPTION)issues.push({...ctx,code:'DESCRIPTION_LONG',characters:p.description.length,severity:'review'});
      if(p.title?.length>MAX_TITLE)issues.push({...ctx,code:'TITLE_LONG',characters:p.title.length,severity:'review'});
      if(withImpact.has(p.proposal_key)&&!p.description?.trim())issues.push({...ctx,code:'IMPACT_UNEXPLAINED',severity:'blocking'});
      if(!p.source_url&&budget.origin==='party')issues.push({...ctx,code:'SOURCE_URL_MISSING',severity:'review'});
    }
    rows.push({budget_key:budget.budget_key,origin:budget.origin,version:budget.version,
      proposals:proposals.length,impacts:impacts.length,
      issues,review_count:issues.length});
  }
}
const report={contract:'v2-proposal-editorial-audit',max_title:MAX_TITLE,max_description:MAX_DESCRIPTION,
  note:'Warnings require human editorial review. No automatic description rewrite. No accounting inference.',
  totals:{budgets:rows.length,proposals:rows.reduce((n,x)=>n+x.proposals,0),
    impacts:rows.reduce((n,x)=>n+x.impacts,0),
    issues:rows.reduce((n,x)=>n+x.review_count,0),
    blocking:rows.reduce((n,x)=>n+x.issues.filter(i=>i.severity==='blocking').length,0)},
  budgets:rows};
const output=process.argv.find(x=>x.startsWith('--output='))?.slice('--output='.length);
if(output)writeFileSync(resolve(output),JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify({totals:report.totals,by_budget:rows.map(({budget_key,proposals,impacts,issues})=>({
  budget_key,proposals,impacts,description_missing:issues.filter(i=>i.code==='DESCRIPTION_MISSING').length,
  description_long:issues.filter(i=>i.code==='DESCRIPTION_LONG').length,
  title_long:issues.filter(i=>i.code==='TITLE_LONG').length
}))},null,2));
if(report.totals.blocking>0)process.exitCode=1;
