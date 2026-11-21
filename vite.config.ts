import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {execFileSync} from 'node:child_process';
// @ts-expect-error Build-time metadata resolver is a plain Node ESM module.
import {resolveBuildIdentity,validSha} from './scripts/build-identity.mjs';

function localSha():string|null{
  try {return validSha(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());}
  catch {return null;}
}

export default defineConfig(async ()=>{
  const sha:string|null=validSha(process.env.VERCEL_GIT_COMMIT_SHA)
    ||validSha(process.env.GITHUB_SHA)
    ||localSha();
  const owner=process.env.VERCEL_GIT_REPO_OWNER||'dsissoko';
  const slug=process.env.VERCEL_GIT_REPO_SLUG||'france-budget';
  const repo=owner+'/'+slug;
  // Only production builds attempt a release lookup. Missing API access
  // must never turn the package.json or Release Please manifest into a release.
  const identity=process.env.VERCEL || process.env.CHECK_GITHUB_RELEASES==='1'
    ?await resolveBuildIdentity({sha,repo,token:process.env.GITHUB_TOKEN})
    :{sha,releaseTag:null,commitsSinceRelease:null};
  return {
    plugins:[react()],
    define:{__BUILD_METADATA__:JSON.stringify({...identity,repo})}
  };
});
