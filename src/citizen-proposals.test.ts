import {describe,it,expect} from 'vitest';
import {availablePost,migrateLegacyOverrides,normalizeCitizenMeasures,updateImpact,validExclusiveProposals,type CitizenMeasure} from './citizen-proposals';

const a:CitizenMeasure={id:'a',title:'Éducation',description:'',impacts:[{kind:'expenses',categoryId:'school',delta:3}]};
const b:CitizenMeasure={id:'b',title:'Recherche',description:'',impacts:[{kind:'expenses',categoryId:'research',delta:1}]};

describe('propositions citoyennes',()=>{
 it('normalise les mesures historiques à un seul poste',()=>{
  expect(normalizeCitizenMeasures([{id:'legacy',title:'X',description:'Y',kind:'expenses',categoryId:'school',delta:2}])[0].impacts)
   .toEqual([{kind:'expenses',categoryId:'school',delta:2}]);
 });
 it('réserve les postes par budget, mais les rend disponibles pour leur propriétaire',()=>{
  expect(availablePost('expenses','school',[a,b],null)).toBe(false);
  expect(availablePost('expenses','school',[a,b],'a')).toBe(true);
  expect(availablePost('expenses','research',[a,b],'a')).toBe(false);
  expect(availablePost('revenues','income',[a,b],'a')).toBe(true);
 });
 it('interdit les chevauchements même entre propositions différentes',()=>{
  expect(validExclusiveProposals([a,b])).toBe(true);
  expect(validExclusiveProposals([a,{...b,impacts:[...b.impacts,...a.impacts]}])).toBe(false);
 });
 it('reprend les modifications historiques sans doubler les postes déjà attribués',()=>{
  const result=migrateLegacyOverrides([a],{revenues:{tax:110},expenses:{school:13,research:15}},(side,id)=>side==='revenues'&&id==='tax'?100:side==='expenses'&&id==='school'?10:side==='expenses'&&id==='research'?12:undefined);
  expect(result).toHaveLength(2);
  expect(result[1].impacts).toEqual([{kind:'revenues',categoryId:'tax',delta:10},{kind:'expenses',categoryId:'research',delta:3}]);
  expect(validExclusiveProposals(result)).toBe(true);
 });
 it('libère un poste quand sa jauge revient à la référence',()=>{
  expect(updateImpact(a.impacts,'expenses','school',0)).toEqual([]);
  expect(updateImpact(a.impacts,'revenues','tax',-2)).toHaveLength(2);
 });
});
