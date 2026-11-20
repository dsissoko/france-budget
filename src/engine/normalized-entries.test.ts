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
});
