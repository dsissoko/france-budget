import {describe,it,expect} from 'vitest';
import {readDraftProposals,proposalEntries,reportedAggregate,validExclusiveProposals,updateImpact} from './v2-budget';
describe('V2 canonical frontend domain',()=>{
 it('uses the same proposal and impact contract for both origins',()=>{
  const x=readDraftProposals([{proposalKey:'p1',title:'Titre',description:'Explication',
    impacts:[{side:'expenses',categoryId:'defense',deltaAmountBn:-25}]}]);
  expect(proposalEntries(x)[0]).toMatchObject({side:'expenses',categoryId:'defense',amount:-25});
  expect(validExclusiveProposals([...x,...x])).toBe(false);
  expect(updateImpact(x[0].impacts,'expenses','defense',0)).toEqual([]);
 });
 it('supports older local drafts without persisting the old schema',()=>{
  const x=readDraftProposals([{id:'legacy',title:'Titre',description:'',
    impacts:[{kind:'revenues',categoryId:'income',delta:2}]}]);
  expect(x[0].proposalKey).toBe('legacy');
  expect(x[0].impacts[0]).toEqual({side:'revenues',categoryId:'income',deltaAmountBn:2});
 });
 it('never fabricates an aggregate when only a title is available',()=>{
  expect(reportedAggregate({budgetMode:'AGGREGATE',documentary:{aggregates:[]}})).toBeNull();
 });
});
