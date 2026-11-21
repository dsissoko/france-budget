import {normalizeCitizenMeasures} from './citizen-proposals';
export const publishedBudgetUrl = (id: string, origin: string) =>
  origin.replace(/\/$/, '') + '/b/' + encodeURIComponent(id);

type ComparableScenario = {
  budget: { revenues: Record<string, number>; expenses: Record<string, number> };
  picked: string[];
  citizenMeasures?: unknown;
};

// Compare effective values, not JSON key order (Neon JSONB may reorder object properties).
export function samePublishedScenario(
  current: ComparableScenario,
  published: ComparableScenario,
  revenueDefaults: Array<{ id: string; amount: number }>,
  expenseDefaults: Array<{ id: string; amount: number }>,
): boolean {
  if (current.picked.length !== published.picked.length ||
      [...current.picked].sort().join('|') !== [...published.picked].sort().join('|')) return false;
  if (!revenueDefaults.every(c => (current.budget.revenues[c.id] ?? c.amount) === (published.budget.revenues[c.id] ?? c.amount)) ||
      !expenseDefaults.every(c => (current.budget.expenses[c.id] ?? c.amount) === (published.budget.expenses[c.id] ?? c.amount))) return false;
  const normalized = (items: ComparableScenario['citizenMeasures']) =>
    normalizeCitizenMeasures(items).map(m => [m.id, m.title, m.description, ...m.impacts.map(i=>[i.kind,i.categoryId,i.delta].join(':')).sort()].join('\u001f')).sort();
  return JSON.stringify(normalized(current.citizenMeasures)) === JSON.stringify(normalized(published.citizenMeasures));
}

export const readBudgetLink = (search: string): string | null => {
  const id = new URLSearchParams(search).get('budget');
  return id && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id) ? id : null;
};
