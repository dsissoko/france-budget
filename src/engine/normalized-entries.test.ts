import { describe, expect, it } from 'vitest';
import { measures, revenues, expenses, offBudget, type Measure } from '../data';
import { calculateScenario, projectMeasure } from '../projection';

const documented: Measure = {
  id: 'fixture-documented-entry',
  party: 'TEST',
  theme: 'Test',
  title: 'Proposition source validée',
  revenueDelta: 3,
  expenseDelta: 2,
  source: 'https://example.org/programme.pdf',
  year: 2027,
  status: 'publié',
  description: 'Fixture contrôlant le contrat APU',
  apuEntries: [
    { side: 'revenues', categoryId: 'vat', amount: 3 },
    { side: 'expenses', categoryId: 'education', amount: 2 },
  ],
};

describe('Contrat des écritures APU normalisées', () => {
  it('consomme les écritures explicites sans règle codée par identifiant', () => {
    const entries = projectMeasure(documented);
    expect(entries).toHaveLength(2);
    expect(entries.map(e => [e.side, e.categoryId, e.amount])).toEqual([
      ['revenues', 'vat', 3],
      ['expenses', 'education', 2],
    ]);
  });

  it('conserve le moteur et applique les recettes moins les dépenses', () => {
    const baseline = calculateScenario([]);
    measures.push({ ...documented });
    try {
      const actual = calculateScenario([documented.id]);
      expect(actual.deficit).toBeCloseTo(baseline.deficit - 1, 8);
      expect(actual.balanceDelta).toBeCloseTo(1, 8);
    } finally {
      measures.splice(measures.findIndex(m => m.id === documented.id), 1);
    }
  });

  it('refuse une ventilation vide, même si la mesure paraît publiée', () => {
    expect(() => projectMeasure({ ...documented, apuEntries: [] })).toThrow('Affectation APU absente');
  });

  it('refuse une catégorie inexistante ou du mauvais côté', () => {
    expect(() => projectMeasure({
      ...documented, apuEntries: [{ side: 'revenues', categoryId: 'education', amount: 3 }],
    })).toThrow('Écriture APU invalide');
    expect(() => projectMeasure({
      ...documented, apuEntries: [{ side: 'expenses', categoryId: 'invented', amount: 2 }],
    })).toThrow('Écriture APU invalide');
  });

  it('refuse un total non réconcilié avec les variations déclarées', () => {
    expect(() => projectMeasure({
      ...documented, apuEntries: [{ side: 'revenues', categoryId: 'vat', amount: 2 }],
    })).toThrow('Écritures APU et montant revendiqué incohérents');
  });

  it('bloque toute la projection documentée au lieu de calculer un déficit partiel', () => {
    const invalid = {
      ...documented,
      apuEntries: [{ side: 'revenues' as const, categoryId: 'vat', amount: 42 }],
    };
    measures.push(invalid);
    try {
      expect(() => calculateScenario([invalid.id])).toThrow('incohérents');
    } finally {
      measures.splice(measures.findIndex(m => m.id === invalid.id), 1);
    }
  });

  it('détecte une quantité non finie dans une écriture APU', () => {
    expect(() => projectMeasure({
      ...documented, apuEntries: [{ side: 'revenues', categoryId: 'vat', amount: Number.NaN }],
    })).toThrow('Écriture APU invalide');
  });
  it('interdit le retour silencieux aux règles locales pour une mesure Neon', () => {
    const fromNeon = { ...documented, id: 'rn-vat', referenceOrigin: 'neon' as const, apuEntries: undefined };
    expect(() => projectMeasure(fromNeon)).toThrow('Affectation APU Neon absente');
    expect(() => projectMeasure({ ...fromNeon, apuEntries: [] })).toThrow('Affectation APU absente');
  });

  it('refuse un scénario entier lorsque la mesure Neon n’a aucune écriture', () => {
    const invalid: Measure = { ...documented, id: 'fixture-neon-without-entries', referenceOrigin: 'neon', apuEntries: undefined };
    measures.push(invalid);
    try {
      expect(() => calculateScenario([invalid.id])).toThrow('Affectation APU Neon absente');
    } finally {
      measures.splice(measures.findIndex(m => m.id === invalid.id), 1);
    }
  });

  it('calcule un référentiel injecté sans modifier les tableaux globaux', () => {
    const reference = {
      revenues: [{ id: 'vat', label: 'TVA', amount: 100, canonical: 'test', description: 'test' }],
      expenses: [{ id: 'education', label: 'Éducation', amount: 120, canonical: 'test', description: 'test' }],
      offBudget: [],
      measures: [{ ...documented, referenceOrigin: 'neon' as const }],
    };
    const result = calculateScenario([documented.id], { revenues: {}, expenses: {} }, [], reference);
    expect(result.revenueTotal).toBe(103);
    expect(result.expenseTotal).toBe(122);
    expect(result.deficit).toBe(19);
    expect(result.balanceDelta).toBe(1);
    expect(reference.revenues[0].amount).toBe(100);
    expect(reference.expenses[0].amount).toBe(120);
    expect(calculateScenario([], { revenues: {}, expenses: {} }, [], reference).deficit).toBe(20);
  });

  it('préserve le déficit de référence et les soldes RN/LFI après migration Neon', () => {
    const neonReference = {
      revenues: revenues.map(c => ({...c, amount: c.id === 'other' ? c.amount + 0.1 : c.amount})),
      expenses: expenses.map(c => ({...c, amount: c.id === 'other-expenses' ? c.amount + 0.1 : c.amount})),
      offBudget: [...offBudget],
      measures: measures.filter(m => ['rn-vat','rn-social','rn-agencies','lfi-school','lfi-green'].includes(m.id)).map(m => ({
        ...m, referenceOrigin: 'neon' as const,
        apuEntries: m.id === 'rn-vat' ? [{side:'revenues' as const,categoryId:'vat',amount:-14.46}]
          : m.id === 'rn-social' ? [{side:'expenses' as const,categoryId:'social',amount:-6.1}]
          : m.id === 'rn-agencies' ? [{side:'expenses' as const,categoryId:'general',amount:-8.213}]
          : m.id === 'lfi-school' ? [{side:'expenses' as const,categoryId:'education',amount:3.6}]
          : [{side:'expenses' as const,categoryId:'environment',amount:4.24},{side:'expenses' as const,categoryId:'economy',amount:6.36}],
      })),
    };
    const original = calculateScenario([]);
    const migrated = calculateScenario([], undefined, [], neonReference);
    expect(migrated.deficit).toBe(original.deficit);
    expect(migrated.deficit).toBe(152.5);
    for(const measure of neonReference.measures){
      const before = calculateScenario([measure.id]);
      const after = calculateScenario([measure.id],undefined,[],neonReference);
      expect(after.balanceDelta).toBeCloseTo(before.balanceDelta,2);
      expect(after.deficit).toBeCloseTo(before.deficit,2);
    }
  });

  it('reproduit les six écritures APU Neon des cinq mesures RN/LFI historiques', () => {
    // Snapshot contrôlé sur une branche Neon isolée le 20/11/2026.
    const fixtures = [
      { id: 'rn-vat', revenueDelta: -14.46, expenseDelta: 0, entries: [['revenues', 'vat', -14.46]] },
      { id: 'rn-social', revenueDelta: 0, expenseDelta: -6.1, entries: [['expenses', 'social', -6.1]] },
      { id: 'rn-agencies', revenueDelta: 0, expenseDelta: -8.213, entries: [['expenses', 'general', -8.213]] },
      { id: 'lfi-school', revenueDelta: 0, expenseDelta: 3.6, entries: [['expenses', 'education', 3.6]] },
      { id: 'lfi-green', revenueDelta: 0, expenseDelta: 10.6, entries: [['expenses', 'environment', 4.24], ['expenses', 'economy', 6.36]] },
    ] as const;
    const baseline = calculateScenario([]);
    for (const fixture of fixtures) {
      const measure: Measure = {
        ...documented, id: fixture.id, revenueDelta: fixture.revenueDelta,
        expenseDelta: fixture.expenseDelta, referenceOrigin: 'neon',
        apuEntries: fixture.entries.map(([side, categoryId, amount]) => ({ side: side as 'revenues' | 'expenses', categoryId, amount })),
      };
      const entries = projectMeasure(measure);
      expect(entries.map(e => [e.side, e.categoryId, e.amount])).toEqual(fixture.entries.map(e => [...e]));
      // Le moteur doit employer les écritures Neon et non les anciennes règles.
      const previous = measures.findIndex(m => m.id === fixture.id);
      const original = previous >= 0 ? measures[previous] : undefined;
      if (previous >= 0) measures[previous] = measure;
      else measures.push(measure);
      try {
        const actual = calculateScenario([fixture.id]);
        expect(actual.balanceDelta).toBeCloseTo(fixture.revenueDelta - fixture.expenseDelta, 2);
        expect(actual.deficit).toBeCloseTo(baseline.deficit - actual.balanceDelta, 2);
      } finally {
        if (previous >= 0 && original) measures[previous] = original;
        else measures.splice(measures.findIndex(m => m.id === fixture.id), 1);
      }
    }
  });

});
