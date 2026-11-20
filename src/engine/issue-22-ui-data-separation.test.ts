import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
describe('Issue #22 — aucune valeur comptable officielle figée dans la présentation',()=>{
 const app=readFileSync(new URL('../App.tsx',import.meta.url),'utf8');
 it('affiche les agrégats officiels issus du référentiel chargé',()=>{
  expect(app).toContain('currency(baselineRevenue)');
  expect(app).toContain('currency(baselineExpense)');
  expect(app).toContain('currency(BASE)');
  expect(app).not.toContain('1 561,7 Md€');
  expect(app).not.toContain('1 714,2 Md€');
  expect(app).not.toContain('152,5 Md€');
 });
 it('publie l’année Neon et n’utilise pas un millésime fixe',()=>{
  expect(app).toContain('referenceYear:simulationParams!.referenceYear');
  expect(app).toContain('yearsFor(simulationParams)');
  expect(app).toContain('voteQualification(BASE,b.result.balanceDelta,years,simulationParams??undefined)');
 });
});
