import {describe,expect,it} from 'vitest';
import {budgetMaturity,maturityStatuses} from './budget-maturity';

describe('maturité générique des budgets, affichage initial réservé aux partis',()=>{
 it('définit exactement quatre statuts métier stables',()=>{
  expect(maturityStatuses).toEqual(['en_preparation','complet','a_confirmer','confirme']);
 });
 it('ne montre aucun badge de maturité aux citoyens',()=>{
  expect(budgetMaturity({origin:'citizen',maturity_status:'a_confirmer'})).toBeNull();
 });
 it('affiche les états des partis, avec À confirmer en vert',()=>{
  expect(budgetMaturity({origin:'party',maturity_status:'en_preparation'})?.label).toBe('En préparation');
  expect(budgetMaturity({origin:'party',maturity_status:'complet'})?.label).toBe('Complet');
  const ready=budgetMaturity({origin:'party',maturity_status:'a_confirmer'});
  expect(ready?.label).toBe('À confirmer');
  expect(ready?.tone).toBe('ready');
 });
 it('n’attribue jamais une confirmation sans organisation, date et preuve HTTPS',()=>{
  expect(budgetMaturity({origin:'party',maturity_status:'confirme'})?.label).not.toBe('Confirmé');
  expect(budgetMaturity({origin:'party',maturity_status:'confirme',
   confirmation_organization:'Parti exemple',confirmed_at:'2026-11-20T09:00:00Z',
   confirmation_evidence_url:'http://example.org/confirmation'})?.label).not.toBe('Confirmé');
  expect(budgetMaturity({origin:'party',maturity_status:'confirme',
   confirmation_organization:'Parti exemple',confirmed_at:'2026-11-20T09:00:00Z',
   confirmation_evidence_url:'https://example.org/confirmation'})?.label).toBe('Confirmé');
 });
 it('n’interprète pas un statut inconnu comme une confirmation',()=>{
  expect(budgetMaturity({origin:'party',maturity_status:'unexpected'})?.status).toBe('en_preparation');
 });
});
