import {describe,it,expect} from 'vitest';
import {calculateDocumentedBudget} from './documented-budget';
import {accountingService} from './accounting';
import type {PartySourceLine} from './party-proposals';

const first:PartySourceLine={
  id:'p-1',groupId:'tax',direction:'revenue_increase',amount:5,
  sourceUrl:'https://example.org/budget-officiel.pdf',
  apuDecision:'calculate',
  allocation:[{side:'revenues',categoryId:'income',amount:5}]
};
const expense:PartySourceLine={
 id:'p-2',groupId:'tax',direction:'expense_decrease',amount:3,
 sourceUrl:'https://example.org/budget-officiel.pdf',apuDecision:'calculate',
 allocation:[{side:'expenses',categoryId:'general',amount:-3}]
};
describe('Adaptateur documentaires -> moteur comptable commun',()=>{
 it('préserve sans changement l ancien moteur des budgets citoyens',()=>{
   const overrides={revenues:{vat:270},expenses:{health:290}};
   const legacy=accountingService.calculate([],overrides);
   expect(calculateDocumentedBudget([],overrides)).toEqual(legacy);
   expect(calculateDocumentedBudget([])).toEqual(accountingService.calculate([]));
 });
 it('projette les effets documentés, une fois seulement, sur le même déficit',()=>{
   const baseline=accountingService.calculate([]);
   const scenario=calculateDocumentedBudget([{id:'tax',lines:[first,expense]}]);
   expect(scenario.entries).toHaveLength(2);
   expect(scenario.balanceDelta).toBeCloseTo(8,8);
   expect(scenario.deficit).toBeCloseTo(baseline.deficit-8,8);
   expect(scenario.revenues.income).toBeCloseTo(baseline.revenues.income+5,8);
   expect(scenario.expenses.general).toBeCloseTo(baseline.expenses.general-3,8);
 });
 it('ne transforme pas un transfert interne tagué manuellement en économie APU',()=>{
   const excluded={...expense,id:'internal',apuDecision:'non_chiffrable_apu' as const,
     apuReason:'État et collectivités sont tous deux dans les APU',allocation:undefined};
   const scenario=calculateDocumentedBudget([{id:'tax',lines:[first,excluded]}]);
   expect(scenario.balanceDelta).toBeCloseTo(5,8);
   expect(scenario.entries).toHaveLength(1);
 });
 it('refuse le même élément source dans deux propositions',()=>{
   const line={...first,id:'duplicate'};
   expect(()=>calculateDocumentedBudget([
     {id:'tax',lines:[line]},
     {id:'tax2',lines:[{...line,groupId:'tax2'}]}
   ])).toThrow('deux fois');
 });
 it('refuse une proposition sans ventilation revue ou un groupe vide',()=>{
   expect(()=>calculateDocumentedBudget([{id:'tax',lines:[{...first,allocation:undefined}]}])).toThrow('Affectation');
   expect(()=>calculateDocumentedBudget([{id:'tax',lines:[]}])).toThrow('Groupe vide');
 });
 it('ne double pas une mesure traditionnelle avec le même identifiant source',()=>{
   expect(()=>calculateDocumentedBudget([{id:'tax',lines:[first]}],undefined,['source:p-1'])).toThrow('déjà');
 });
});
