#!/usr/bin/env node
// Non-destructive V2 policy migration for a populated database.
// Emits SQL by default; --apply is explicit and never runs db:init.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'../..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');
export function policySql(){
 const source=read('db/v2/003_citizen_crud.sql');
 const start=source.indexOf('CREATE OR REPLACE FUNCTION v2.write_citizen_budget(');
 const end=source.indexOf('END $$;',start);
 if(start<0||end<0)throw Error('Cannot identify V2 citizen write function');
 const functionSql=source.slice(start,end+'END $$;'.length);
 if(!functionSql.includes('publication_limit_reached')||
    functionSql.includes('publication_rate_limited')||
    !functionSql.includes('pg_advisory_xact_lock'))
   throw Error('Unexpected publication policy: refusing migration');
 const featured=read('db/v2/007_citizen_featured.sql');
 if(!featured.includes('CREATE TRIGGER trg_refresh_featured_citizen_votes')||
    !featured.includes('SECURITY DEFINER'))
   throw Error('Missing V2 featured trigger safety requirements');
 return 'BEGIN;\n'+functionSql+'\n'+
  'ALTER FUNCTION v2.write_citizen_budget(jsonb,text,text,integer) SECURITY DEFINER;\n'+
  'REVOKE ALL ON FUNCTION v2.write_citizen_budget(jsonb,text,text,integer) FROM PUBLIC;\n'+
  featured+'\nCOMMIT;\n';
}
async function main(){
 const args=process.argv.slice(2);
 if(args.some(arg=>!['--apply','--confirm-v2-policy'].includes(arg)))
   throw Error('Usage: node scripts/v2/apply-policy.mjs [--apply --confirm-v2-policy]');
 const sql=policySql();
 if(!args.includes('--apply')){
   console.log(JSON.stringify({dryRun:true,changes:['featured vote/publication triggers','remove rolling 24h quota'],keeps:['100 published citizen limit','votes','budgets'],productionWrites:false}));
   return;
 }
 if(!args.includes('--confirm-v2-policy'))throw Error('--confirm-v2-policy required');
 if(!process.env.V2_DATABASE_URL)throw Error('V2_DATABASE_URL required');
 const result=spawnSync('psql',['-X','--set=ON_ERROR_STOP=1','--quiet'],{
   input:sql,encoding:'utf8',env:{...process.env,PGDATABASE:process.env.V2_DATABASE_URL},
   maxBuffer:2*1024*1024
 });
 if(result.error)throw result.error;
 if(result.status!==0){process.stderr.write(result.stderr||'psql failed');throw Error('V2 policy migration rolled back');}
 console.log('V2 citizen policy migration applied transactionally.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(e=>{console.error(e.message);process.exitCode=1});
