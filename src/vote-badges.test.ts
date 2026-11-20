import {describe,expect,it} from 'vitest';
import {visibleVoteBadges} from './vote-badges';

describe('Voter : indicateurs indépendants',()=>{
 it('affiche trajectoire 2032 et maturité pour un scénario politique calculable',()=>{
  expect(visibleVoteBadges({origin:'party'})).toEqual({trajectory:true,maturity:true});
 });
 it('n’affiche que la trajectoire pour un citoyen',()=>{
  expect(visibleVoteBadges({origin:'citizen'})).toEqual({trajectory:true,maturity:false});
 });
 it('n’invente pas d’évaluation 2032 pour un programme purement documentaire',()=>{
  expect(visibleVoteBadges({origin:'party',documentaryOnly:true})).toEqual({trajectory:false,maturity:true});
 });
});
