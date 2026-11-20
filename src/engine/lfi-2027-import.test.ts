import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { expenses, revenues } from '../data';
import { calculateScenario } from '../projection';
import type { Measure } from '../model';

// Contrôle générique d'intégration documentaire : aucune validation économique implicite.
// Les entrées candidates sont un TEST de capacité du moteur, jamais un scénario public.
const csv = (filename: string) => {
  const text = readFileSync(new URL('../../data/programmes/' + filename, import.meta.url), 'utf8').trim();
  const lines = text.split(/\r?\n/).map(line => [...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m => m[1].replace(/""/g, '"')));
  const headers = lines.shift()!;
  return lines.map(columns => Object.fromEntries(headers.map((h, i) => [h, columns[i]])));
};
const source = csv('lfi-2027-mesures-primaires.csv');
const qualification = csv('lfi-2027-qualification-apu.csv');

describe('Intégration générique d’un programme politique — LFI 2027', () => {
  it('recense 28 lignes élémentaires avec identifiants uniques et références primaires', () => {
    expect(source).toHaveLength(28);
    expect(new Set(source.map(x => x.source_row_id)).size).toBe(28);
    expect(source.every(x => x.party_code === 'LFI' && x.source_year === '2027')).toBe(true);
    expect(source.every(x => Number(x.source_page) >= 8 && Number(x.source_page) <= 14)).toBe(true);
    expect(source.every(x => x.source_url.startsWith('https://'))).toBe(true);
  });

  it('reconcilie exactement les montants déclarés sans compter les agrégats', () => {
    const total = (side: string) => Math.round(source.filter(x => x.direction === side)
      .reduce((sum, row) => sum + Number(row.claimed_amount_bn), 0) * 1000) / 1000;
    expect(total('revenue_increase')).toBe(106.4);
    expect(total('expense_increase')).toBe(81.7);
    expect(total('revenue_increase') - total('expense_increase')).toBeCloseTo(24.7, 8);
  });

  it('qualifie toutes les lignes et n’en active aucune sans validation explicite', () => {
    expect(qualification).toHaveLength(28);
    expect(new Set(qualification.map(x => x.source_row_id)).size).toBe(28);
    expect(qualification.every(x => ['candidate', 'needs_split', 'year_uncertain'].includes(x.qualification))).toBe(true);
    expect(qualification.filter(x => x.qualification === 'candidate')).toHaveLength(19);
    expect(qualification.filter(x => x.qualification === 'needs_split')).toHaveLength(8);
    expect(qualification.filter(x => x.qualification === 'year_uncertain')).toHaveLength(1);
    const keys = new Set([...revenues.map(x => 'revenues:' + x.id), ...expenses.map(x => 'expenses:' + x.id)]);
    expect(qualification.every(x => keys.has(x.proposed_side + ':' + x.proposed_category))).toBe(true);
    expect(qualification.every(x => x.source_year === '2027')).toBe(true);
  });

  it('projette une mesure candidate via les écritures génériques, sans règle LFI codée', () => {
    const row = qualification.find(x => x.source_row_id === 'D05')!;
    const measure: Measure = {
      id: 'test-programme-documentaire-2027',
      party: 'TEST', theme: 'Éducation', title: row.title,
      revenueDelta: 0, expenseDelta: Number(row.claimed_amount_bn),
      source: 'https://example.org/programme.pdf', year: 2027,
      status: 'publié', description: 'Test de capacité, montant non validé',
      referenceOrigin: 'neon',
      apuEntries: [{side: 'expenses',categoryId: row.proposed_category,amount:Number(row.claimed_amount_bn)}],
    };
    const base = {revenues, expenses, offBudget: [], measures: [measure]};
    const initial = calculateScenario([], {revenues:{},expenses:{}}, [], base);
    const result = calculateScenario([measure.id], {revenues:{},expenses:{}}, [], base);
    expect(result.deficit - initial.deficit).toBeCloseTo(0.5, 8);
    expect(result.entries).toHaveLength(1);
  });
});
