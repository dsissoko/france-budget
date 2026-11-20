import { describe, expect, it } from 'vitest';
import { expenses, measures, offBudget, revenues, type Measure } from '../data';
import { calculateScenario, type ReferenceModel } from '../projection';

// Snapshot des écritures vérifiées dans Neon le 20/11/2026.
// Ces fixtures ne sont pas une preuve de provenance des futurs imports politiques.
const entries: Record<string, NonNullable<Measure['apuEntries']>> = {
  'rn-vat': [{ side: 'revenues', categoryId: 'vat', amount: -14.46 }],
  'rn-social': [{ side: 'expenses', categoryId: 'social', amount: -6.1 }],
  'rn-agencies': [{ side: 'expenses', categoryId: 'general', amount: -8.213 }],
  'lfi-school': [{ side: 'expenses', categoryId: 'education', amount: 3.6 }],
  'lfi-green': [
    { side: 'expenses', categoryId: 'environment', amount: 4.24 },
    { side: 'expenses', categoryId: 'economy', amount: 6.36 },
  ],
};
const ids = Object.keys(entries);
const reference: ReferenceModel = {
  revenues: revenues.map(c => ({ ...c, amount: c.id === 'other' ? c.amount + 0.1 : c.amount })),
  expenses: expenses.map(c => ({ ...c, amount: c.id === 'other-expenses' ? c.amount + 0.1 : c.amount })),
  offBudget: offBudget.map(c => ({ ...c })),
  measures: measures.filter(m => ids.includes(m.id)).map(m => ({
    ...m, referenceOrigin: 'neon' as const, apuEntries: entries[m.id].map(e => ({ ...e })),
  })),
};
const cases = Array.from({ length: 1 << ids.length }, (_, mask) =>
  ids.filter((_, index) => (mask & (1 << index)) !== 0)
);

describe('Issue #22 — parité exhaustive des combinaisons historiques', () => {
  it('préserve les soldes et les écritures des 32 sous-ensembles RN/LFI', () => {
    for (const selected of cases) {
      const before = calculateScenario(selected);
      const after = calculateScenario(selected, undefined, [], reference);
      expect(after.deficit, selected.join(',')).toBeCloseTo(before.deficit, 2);
      expect(after.balanceDelta, selected.join(',')).toBeCloseTo(before.balanceDelta, 2);
      expect(after.entries.map(e => [e.measureId, e.side, e.categoryId]))
        .toEqual(before.entries.map(e => [e.measureId, e.side, e.categoryId]));
      after.entries.forEach((entry, index) => {
        expect(entry.amount).toBeCloseTo(before.entries[index].amount, 8);
      });
    }
  });

  it('préserve les scénarios citoyens combinés aux propositions historiques', () => {
    const citizen = {
      revenues: { vat: 270, business: 120 },
      expenses: { health: 290, education: 175 },
      offBudget: { 'business-tax-relief': 39.7 },
    };
    for (const selected of cases) {
      const before = calculateScenario(selected, citizen);
      const after = calculateScenario(selected, citizen, [], reference);
      expect(after.deficit, selected.join(',')).toBeCloseTo(before.deficit, 2);
      expect(after.balanceDelta, selected.join(',')).toBeCloseTo(before.balanceDelta, 2);
      expect(after.revenues.vat).toBeCloseTo(before.revenues.vat, 2);
      expect(after.expenses.education).toBeCloseTo(before.expenses.education, 2);
      expect(after.offBudget['business-tax-relief']).toBeCloseTo(before.offBudget['business-tax-relief'], 2);
    }
  });

  it('refuse une mesure Neon sans écritures, même si une règle historique existe', () => {
    const missing = reference.measures.map(m =>
      m.id === 'rn-vat' ? { ...m, apuEntries: undefined } : m
    );
    expect(() => calculateScenario(['rn-vat'], undefined, [], { ...reference, measures: missing }))
      .toThrow('Affectation APU Neon absente');
  });

  it('refuse une ventilation Neon dont le montant ne correspond pas au montant publié', () => {
    const invalid = reference.measures.map(m =>
      m.id === 'lfi-green'
        ? { ...m, apuEntries: [{ side: 'expenses' as const, categoryId: 'environment', amount: 4.24 }] }
        : m
    );
    expect(() => calculateScenario(['lfi-green'], undefined, [], { ...reference, measures: invalid }))
      .toThrow('Écritures APU et montant revendiqué incohérents');
  });

  it('ne modifie pas le référentiel injecté pendant les projections', () => {
    const snapshot = JSON.stringify(reference);
    for (const selected of cases) calculateScenario(selected, undefined, [], reference);
    expect(JSON.stringify(reference)).toBe(snapshot);
  });
});
