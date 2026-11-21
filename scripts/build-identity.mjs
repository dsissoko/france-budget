const SHA_RE = /^[a-f0-9]{40}$/i;
const TAG_RE = /^v[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/;
export const validSha = value => typeof value === 'string' && SHA_RE.test(value) ? value.toLowerCase() : null;
export const validTag = value => typeof value === 'string' && TAG_RE.test(value) ? value : null;
export const formatBuildLabel = ({sha,releaseTag,commitsSinceRelease}) => {
  const short=validSha(sha)?.slice(0,7);
  if(!short)return 'build inconnu';
  const tag=validTag(releaseTag);
  if(!tag || !Number.isSafeInteger(commitsSinceRelease) || commitsSinceRelease<0)return 'build '+short;
  return tag+(commitsSinceRelease===0?'':'+'+commitsSinceRelease)+' · '+short;
};

const githubHeaders = token => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'france-budget-build',
  ...(token ? {Authorization: 'Bearer '+token} : {})
});

/**
 * A release is official only when GitHub returns a published release,
 * and GitHub compare proves its tagged commit is the built SHA or its ancestor.
 * All network failures fall back to a SHA-only label.
 */
export async function resolveBuildIdentity({
  sha, repo='dsissoko/france-budget', token,
  request=fetch, maxReleases=15
}={}) {
  const validatedSha=validSha(sha);
  const fallback={sha:validatedSha,releaseTag:null,commitsSinceRelease:null};
  if(!validatedSha || !/^[\w.-]+\/[\w.-]+$/.test(repo))return fallback;
  const api='https://api.github.com/repos/'+repo;
  const options={headers:githubHeaders(token),signal:AbortSignal.timeout(3500)};
  const get=async url=>{
    const response=await request(url,options);
    if(!response.ok)throw Error('GitHub response '+response.status);
    return response.json();
  };
  try {
    const releases=await get(api+'/releases?per_page='+maxReleases);
    if(!Array.isArray(releases))return fallback;
    for(const release of releases){
      if(release.draft || release.prerelease)continue;
      const tag=validTag(release.tag_name);
      if(!tag)continue;
      try{
        const compare=await get(api+'/compare/'+encodeURIComponent(tag)+'...'+validatedSha);
        if(compare.status==='identical')return {sha:validatedSha,releaseTag:tag,commitsSinceRelease:0};
        if(compare.status==='ahead' && Number.isSafeInteger(compare.ahead_by) && compare.ahead_by>=0)
          return {sha:validatedSha,releaseTag:tag,commitsSinceRelease:compare.ahead_by};
      }catch{
        // A missing or inaccessible tag is not proof of a published version.
      }
    }
  }catch{
    return fallback;
  }
  return fallback;
}
