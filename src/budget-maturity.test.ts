import {describe,expect,it} from 'vitest';
import {budgetMaturity,maturityStatuses} from './budget-maturity';

describe('maturité conditionnelle, sans discrimination par origine',()=>{
 it('conserve les cinq statuts documentaires',()=>expect(maturityStatuses).toEqual(['non_verifie','en_preparation','complet','a_confirmer','confirme']));
 it('ne crée aucun statut en absence de valeur ou valeur inconnue',()=>{
  expect(budgetMaturity({origin:'citizen'})).toBeNull();
  expect(budgetMaturity({origin:'party',maturity_status:null})).toBeNull();
  expect(budgetMaturity({origin:'party',maturity_status:'unexpected'})).toBeNull();
 });
 it('affiche le statut présent indépendamment de l’origine',()=>{
  expect(budgetMaturity({origin:'citizen',maturity_status:'non_verifie'})?.label).toBe('Non vérifié');
  expect(budgetMaturity({origin:'citizen',maturity_status:'a_confirmer'})?.label).toBe('À confirmer');
  expect(budgetMaturity({origin:'party',maturity_status:'complet'})?.label).toBe('Complet');
  expect(budgetMaturity({origin:'party',maturity_status:'en_preparation'})?.label).toBe('En préparation');
 });
 it('ne présente pas Confirmé sans preuve valide',()=>{
  expect(budgetMaturity({origin:'party',maturity_status:'confirme'})).toBeNull();
  expect(budgetMaturity({origin:'party',maturity_status:'confirme',confirmation_organization:'Parti exemple',confirmed_at:'2026-11-20T09:00:00Z',confirmation_evidence_url:'http://example.org'})).toBeNull();
  expect(budgetMaturity({origin:'party',maturity_status:'confirme',confirmation_organization:'Parti exemple',confirmed_at:'2026-11-20T09:00:00Z',confirmation_evidence_url:'https://example.org'})?.label).toBe('Confirmé');
 });
});
