// Restore the canonical reference as A; leave B open to select a scenario.
export function resetCompareToReference(referenceId: string): {a:string;b:null} {
  return {a:referenceId,b:null};
}
