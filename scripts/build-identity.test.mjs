import {describe,expect,it,vi} from 'vitest';
import {formatBuildLabel,resolveBuildIdentity,validSha} from './build-identity.mjs';

const sha='a'.repeat(40);
const next='b'.repeat(40);
const api='https://api.github.com/repos/dsissoko/france-budget';
const json=(value,status=200)=>({ok:status>=200&&status<300,status,json:async()=>value});

describe('deployment identity',()=>{
  it('recognizes complete SHA only',()=>{
    expect(validSha(sha)).toBe(sha);
    expect(validSha('abc1234')).toBe(null);
    expect(validSha(undefined)).toBe(null);
  });
  it('shows SHA only before any published release',async()=>{
    const request=vi.fn(async()=>json([]));
    const meta=await resolveBuildIdentity({sha,request});
    expect(meta).toEqual({sha,releaseTag:null,commitsSinceRelease:null});
    expect(formatBuildLabel(meta)).toBe('build aaaaaaa');
    expect(request).toHaveBeenCalledOnce();
  });
  it('identifies a published release at its exact commit',async()=>{
    const request=vi.fn(async url=>url.startsWith(api+'/releases')
      ?json([{tag_name:'v1.1.0',draft:false,prerelease:false}])
      :json({status:'identical',ahead_by:0}));
    const meta=await resolveBuildIdentity({sha,request});
    expect(formatBuildLabel(meta)).toBe('v1.1.0 · aaaaaaa');
  });
  it('counts commits after the published release only when ancestry is proven',async()=>{
    const request=vi.fn(async url=>url.startsWith(api+'/releases')
      ?json([{tag_name:'v1.1.0',draft:false,prerelease:false}])
      :json({status:'ahead',ahead_by:3}));
    const meta=await resolveBuildIdentity({sha:next,request});
    expect(formatBuildLabel(meta)).toBe('v1.1.0+3 · bbbbbbb');
  });
  it('ignores draft, prerelease, and divergent releases',async()=>{
    const request=vi.fn(async url=>url.startsWith(api+'/releases')
      ?json([
        {tag_name:'v3.0.0',draft:true,prerelease:false},
        {tag_name:'v2.0.0',draft:false,prerelease:true},
        {tag_name:'v1.1.0',draft:false,prerelease:false}
      ])
      :json({status:'diverged',ahead_by:4}));
    const meta=await resolveBuildIdentity({sha,request});
    expect(formatBuildLabel(meta)).toBe('build aaaaaaa');
  });
  it('fails safely when GitHub is unreachable or commit is invalid',async()=>{
    const request=vi.fn(async()=>{throw Error('offline')});
    expect(formatBuildLabel(await resolveBuildIdentity({sha,request}))).toBe('build aaaaaaa');
    expect(formatBuildLabel(await resolveBuildIdentity({sha:'invalid',request}))).toBe('build inconnu');
  });
});
