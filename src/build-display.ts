export type BuildMetadata = {
  sha: string | null;
  releaseTag: string | null;
  commitsSinceRelease: number | null;
};

declare const __BUILD_METADATA__: BuildMetadata;

export function validSha(value: string | undefined | null): string | null {
  return value && /^[a-f0-9]{40}$/i.test(value) ? value.toLowerCase() : null;
}

export function buildLabel(meta: BuildMetadata): string {
  const short = meta.sha?.slice(0, 7);
  if (!short) return 'build inconnu';
  if (!meta.releaseTag || meta.commitsSinceRelease === null) return 'build ' + short;
  if (meta.commitsSinceRelease === 0) return meta.releaseTag + ' · ' + short;
  return meta.releaseTag + '+' + meta.commitsSinceRelease + ' · ' + short;
}

export function currentBuild(): BuildMetadata {
  return __BUILD_METADATA__;
}
