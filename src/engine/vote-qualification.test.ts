import {describe,it,expect} from 'vitest';
import {voteQualification} from './vote-qualification';
import {years} from '../data';

describe('Voter: the same 2032 verdict as the trajectory chart',()=>{
  it('classifies a budget with a lower 2032 deficit but still rising as relative improvement',()=>{
    expect(voteQualification(152.5,1,years)).toMatchObject({
      label:'Amélioration relative',tone:'warning'
    });
  });
  it('does not mistake a one-time deficit reduction for a falling trajectory',()=>{
    for(const impact of [2.84,3.8,1,37.8,9.8])
      expect(voteQualification(152.5,impact,years)).toMatchObject({label:'Amélioration relative',tone:'warning'});
  });
  it('calls the unmodified and a worse-than-reference budget degradation',()=>{
    expect(voteQualification(152.5,0,years)).toMatchObject({label:'Dégradation',tone:'negative'});
    expect(voteQualification(152.5,-4,years)).toMatchObject({label:'Dégradation',tone:'negative'});
  });
});
