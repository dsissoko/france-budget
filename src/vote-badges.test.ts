import {describe,expect,it} from 'vitest';
import {visibleVoteBadges} from './vote-badges';

describe('Voter : indicateurs indépendants',()=>{
 it('n’affiche la maturité que si elle existe',()=>{
  expect(visibleVoteBadges({origin:'party'})).toEqual({trajectory:true,maturity:false});
  expect(visibleVoteBadges({origin:'citizen'})).toEqual({trajectory:true,maturity:false});
  expect(visibleVoteBadges({origin:'party',maturity_status:'complet'})).toEqual({trajectory:true,maturity:true});
  expect(visibleVoteBadges({origin:'citizen',maturity_status:'complet'})).toEqual({trajectory:true,maturity:true});
 });
 it('n’invente pas de trajectoire pour un budget documentaire',()=>{
  expect(visibleVoteBadges({origin:'party',maturity_status:'complet',documentaryOnly:true})).toEqual({trajectory:false,maturity:true});
 });
});
