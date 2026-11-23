#!/usr/bin/env node
/**
 * #157 — Deterministic guard for editorial-only CSV upgrades.
 * Usage: node scripts/v2/editorial-upgrade.mjs <before-program-directory> <after-program-directory>
 * Read-only: never imports data or connects to Neon.
 */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadBatch,readCsv} from './import.mjs';

const canonicalFiles=['budget.csv','proposals.csv','measures.csv','impacts.csv'];
const optionalEditorialFiles=['presentation.csv'];
const clone=value=>structuredClone(value);
const strictSame=(a,b,label)=>{
 try{assert.deepStrictEqual(a,b);}catch(e){throw Error('EDITORIAL_UPGRADE rejected '+label+': non-editorial change detected',{cause:e});}
};
const noEditorialFields=b=>{
 const copy=clone(b);
 // The raw JSON string changes when a permitted background_text changes;
 // validate its parsed content, not its serialized representation.
 delete copy.budget.documentary_json;
 delete copy.budget.description;
 if(copy.budget.documentary)delete copy.budget.documentary.background_text;
 for(const p of copy.proposals){delete p.title;delete p.description;}
 return copy;
};

export function validateEditorialUpgrade(before,after){
 strictSame(noEditorialFields(before),noEditorialFields(after),'canonical batch');
 const changes=[];
 if(before.budget.description!==after.budget.description)
  changes.push({type:'budget',key:before.budget.budget_key,field:'description'});
 if(before.budget.documentary?.background_text!==after.budget.documentary?.background_text)
  changes.push({type:'budget',key:before.budget.budget_key,field:'documentary.background_text'});
 for(let i=0;i<before.proposals.length;i++)
  for(const field of ['title','description'])
   if(before.proposals[i][field]!==after.proposals[i][field])
    changes.push({type:'proposal',key:before.proposals[i].proposal_key,field});
 return changes;
}

function readPresentation(directory){
 const filename=join(directory,'presentation.csv');
 return existsSync(filename)?readCsv(readFileSync(filename,'utf8')):null;
}

export function validateEditorialDirectories(beforeDir,afterDir){
 const before=resolve(beforeDir),after=resolve(afterDir);
 const beforeFiles=readdirSync(before).sort(),afterFiles=readdirSync(after).sort();
 strictSame(beforeFiles,afterFiles,'file inventory');
 for(const filename of beforeFiles){
  if(!canonicalFiles.includes(filename)&&!optionalEditorialFiles.includes(filename))
   strictSame(readFileSync(join(before,filename)),readFileSync(join(after,filename)),filename);
 }
 // Financial, sourced and provenance CSVs are byte-for-byte immutable.
 for(const filename of ['measures.csv','impacts.csv'])
  strictSame(readFileSync(join(before,filename)),readFileSync(join(after,filename)),filename);
 const changes=validateEditorialUpgrade(loadBatch(before),loadBatch(after));
 const oldPresentation=readPresentation(before),newPresentation=readPresentation(after);
 strictSame(oldPresentation?.length??0,newPresentation?.length??0,'presentation row count');
 if(oldPresentation){
  const strip=rows=>rows.map(row=>{const x={...row};delete x.description;return x;});
  strictSame(strip(oldPresentation),strip(newPresentation),'presentation metadata');
  if(oldPresentation[0]?.description!==newPresentation[0]?.description)
   changes.push({type:'presentation',key:oldPresentation[0].party_code,field:'description'});
  const newBudgetCsv=readCsv(readFileSync(join(after,'budget.csv'),'utf8'))[0];
  if(newBudgetCsv.description!==newPresentation[0].description)
   throw Error('EDITORIAL_UPGRADE rejected presentation.csv: must match budget.csv description (import precedence)');
 }
 return changes;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2);
 if(args.length!==2){console.error('Usage: node scripts/v2/editorial-upgrade.mjs <before-directory> <after-directory>');process.exitCode=2;}
 else try{const changes=validateEditorialDirectories(args[0],args[1]);
  console.log(JSON.stringify({valid:true,writeToNeon:false,changes},null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
