import {describe,it,expect} from 'vitest';
import {voteQualification} from './vote-qualification';
import {years} from '../data';
describe('Voter: every published budget gets the same qualification as its trajectory',()=>{
 it('qualifies the Horizons scenario despite its exact 1 Md€ improvement threshold',()=>{
  expect(voteQualification(152.5,1,years)).toEqual(expect.objectContaining({
   label:'Hausse persistante',tone:'warning'
  }));
 });
 it('does not turn a one-time lower deficit into a green label',()=>{
  for(const impact of [2.84,3.8,1,37.8,9.8])
   expect(voteQualification(152.5,impact,years).tone).toBe('warning');
 });
});
