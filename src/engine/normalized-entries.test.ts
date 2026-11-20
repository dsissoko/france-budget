import { describe, expect, it } from 'vitest';
import { measures, type Measure } from '../data';
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
    const fromNeon = { ...documented, id: 'rn-vat', referenceOrigin: 'neon' as const };
    expect(() => projectMeasure(fromNeon)).toThrow('Affectation APU Neon absente');
    expect(() => projectMeasure({ ...fromNeon, apuEntries: [] })).toThrow('Affectation APU absente');
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
        apuEntries: fixture.entries.map(([side, categoryId, amount]) => ({ side, categoryId, amount })),
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
