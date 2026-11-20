import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Garde-fou architectural : l'application ne doit pas revenir aux données
// historiques quand l'API Neon est absente ou en erreur.
describe('Issue #22 — référentiel de production Neon uniquement', () => {
  const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../../api/reference.ts', import.meta.url), 'utf8');

  it('charge le référentiel depuis l’API et bloque l’interface si indisponible', () => {
    expect(app).toContain("fetch('/api/reference')");
    expect(app).toContain('if(!referenceReady)return');
    expect(app).toContain('Référentiel incomplet');
    expect(app).toContain('Impossible de charger le référentiel budgétaire depuis Neon');
  });

  it('ne recalcule jamais sur le référentiel statique pendant le chargement', () => {
    expect(app).toContain('const activeReference=reference??pendingReference');
    expect(app).toContain('calculateWithReference(ids,overrides,[],activeReference)');
    expect(app).not.toMatch(/:\s*calculateWithReference\(ids,overrides\)/);
    expect(app).not.toMatch(/:\s*auditSelectedWithReference\(ids\)/);
    expect(app).not.toMatch(/:\s*auditMeasureWithReference\(measure\)/);
  });

  it('lit les catégories, hors-budget et écritures APU depuis Neon', () => {
    expect(api).toContain('FROM reference_categories');
    expect(api).toContain('FROM reference_off_budget');
    expect(api).toContain('FROM measure_accounting_entries');
    expect(api).toContain('FROM measures m JOIN budgets b');
    expect(api).toContain("referenceOrigin:'neon'");
    expect(api).toContain('Incohérence APU mesure');
  });
});
