export type BudgetSide = 'revenues' | 'expenses' | 'offBudget';
export type CitizenImpact = { kind: BudgetSide; categoryId: string; delta: number };
export type CitizenMeasure = { id: string; title: string; description: string; impacts: CitizenImpact[] };
export type BudgetOverrides = { revenues: Record<string, number>; expenses: Record<string, number>; offBudget?: Record<string, number> };

const sideKey = (impact: Pick<CitizenImpact, 'kind' | 'categoryId'>) => impact.kind + ':' + impact.categoryId;

export function normalizeCitizenMeasures(raw: unknown): CitizenMeasure[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((m: any) => {
    if (!m || typeof m.id !== 'string') return [];
    const impacts: CitizenImpact[] = Array.isArray(m.impacts) ? m.impacts : (
      typeof m.kind === 'string' && typeof m.categoryId === 'string' && Number.isFinite(m.delta)
        ? [{ kind: m.kind, categoryId: m.categoryId, delta: m.delta }] : []
    );
    return [{
      id: m.id,
      title: typeof m.title === 'string' ? m.title : '',
      description: typeof m.description === 'string' ? m.description : '',
      impacts: impacts.filter(i => i && ['revenues', 'expenses', 'offBudget'].includes(i.kind)
        && typeof i.categoryId === 'string' && Number.isFinite(i.delta) && Math.abs(i.delta) > 0.000001)
    }];
  });
}

export function availablePost(kind: BudgetSide, categoryId: string, proposals: CitizenMeasure[], currentId: string | null): boolean {
  return !proposals.some(p => p.id !== currentId && p.impacts.some(i => sideKey(i) === kind + ':' + categoryId));
}

export function validExclusiveProposals(proposals: CitizenMeasure[]): boolean {
  const occupied = new Set<string>();
  for (const proposal of proposals) {
    for (const impact of proposal.impacts) {
      const key = sideKey(impact);
      if (occupied.has(key) || !Number.isFinite(impact.delta)) return false;
      occupied.add(key);
    }
  }
  return true;
}

export function updateImpact(impacts: CitizenImpact[], kind: BudgetSide, categoryId: string, delta: number): CitizenImpact[] {
  const without = impacts.filter(i => sideKey(i) !== kind + ':' + categoryId);
  return Number.isFinite(delta) && Math.abs(delta) > 0.000001
    ? [...without, {kind, categoryId, delta: Math.round(delta * 1000) / 1000}] : without;
}

export function overridesFromProposals(
  proposals: CitizenMeasure[],
  referenceAmount: (kind: BudgetSide, id: string) => number | undefined,
  current: BudgetOverrides
): BudgetOverrides {
  const oldPosts = Object.keys(current).flatMap(side => Object.keys(current[side as BudgetSide] || {}).map(id => ({kind: side as BudgetSide, id})));
  const next: BudgetOverrides = { revenues: {...current.revenues}, expenses: {...current.expenses}, offBudget: {...current.offBudget} };
  // Only proposal-owned values are controlled here; other imported/reference-origin overrides are preserved.
  for (const p of proposals) for (const i of p.impacts) {
    const base = referenceAmount(i.kind, i.categoryId);
    if (base !== undefined) next[i.kind]![i.categoryId] = Math.max(0, Math.min(base * 2, base + i.delta));
  }
  void oldPosts;
  return next;
}
