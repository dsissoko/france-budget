import {describe,it,expect} from 'vitest';
import {consolidatePartyProposal,type PartySourceLine} from './party-proposals';
const categories={revenues:['vat','income','business'],expenses:['general','social','health']};
const base:PartySourceLine={
 id:'official-1',groupId:'g1',direction:'revenue_increase',amount:5,
 sourceUrl:'https://example.org/official.pdf',apuDecision:'calculate',
 allocation:[{side:'revenues',categoryId:'income',amount:5}]
};
describe('Regroupement documentaire de mesures budgétaires',()=>{
 it('additionne plusieurs sens comptables distincts sans compter le groupe deux fois',()=>{
  const result=consolidatePartyProposal('g1',[base,{
   ...base,id:'official-2',direction:'expense_decrease',amount:3,
   allocation:[{side:'expenses',categoryId:'general',amount:-3}]
  }],categories);
  expect(result.sourceLineCount).toBe(2);
  expect(result.revenueDelta).toBe(5);
  expect(result.expenseDelta).toBe(-3);
  expect(result.revenueDelta-result.expenseDelta).toBe(8);
  expect(result.entries).toHaveLength(2);
 });
 it('exclut explicitement une dotation interne APU sans en déduire une économie externe',()=>{
  const result=consolidatePartyProposal('g1',[{
   ...base,id:'dotation-etat-collectivite',direction:'expense_decrease',amount:5,
   apuDecision:'non_chiffrable_apu',apuReason:'Transfert interne APU, impact net non inféré',
   allocation:undefined
  }],categories);
  expect(result.excludedLineCount).toBe(1);
  expect(result.entries).toHaveLength(0);
  expect(result.expenseDelta).toBe(0);
  expect(result.warnings).toHaveLength(1);
 });
 it('refuse une mesure non justifiée',()=>{
  expect(()=>consolidatePartyProposal('g1',[{...base,apuDecision:'non_chiffrable_apu',allocation:undefined}],categories)).toThrow('Justification APU');
 });
 it('refuse une ventilation incomplète',()=>{
  expect(()=>consolidatePartyProposal('g1',[{...base,allocation:[{side:'revenues',categoryId:'income',amount:4}]}],categories)).toThrow('Ventilation non équilibrée');
 });
 it('refuse les doublons, les groupes croisés et les chevauchements non résolus',()=>{
  expect(()=>consolidatePartyProposal('g1',[base,base],categories)).toThrow('dupliqué');
  expect(()=>consolidatePartyProposal('g1',[{...base,groupId:'g2'}],categories)).toThrow('hors groupe');
  expect(()=>consolidatePartyProposal('g1',[{...base,overlapsWith:'previous-line'}],categories)).toThrow('double compte');
 });
 it('refuse une affectation à la mauvaise catégorie ou au mauvais sens',()=>{
  expect(()=>consolidatePartyProposal('g1',[{...base,allocation:[{side:'expenses',categoryId:'general',amount:5}]}],categories)).toThrow('Nature');
  expect(()=>consolidatePartyProposal('g1',[{...base,allocation:[{side:'revenues',categoryId:'missing',amount:5}]}],categories)).toThrow('Catégorie');
 });
});
