import {describe,it,expect} from 'vitest';
import {readDraftProposals,proposalEntries,reportedAggregate,validExclusiveProposals,updateImpact,computeBudget,computeCitizenDraft,type PublishedBudget} from './v2-budget';
import {simulationService,V1_ASSUMPTIONS,yearsFor} from './engine/simulation';
import type {ReferenceModel} from './projection-core';
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

const cat=(id:string,amount:number)=>({id,amount,label:id,description:id,canonical:id});
const reference:ReferenceModel={
 revenues:[cat('income',103.6),cat('business',86.6),cat('property',71.5),
  cat('contributions',489.2),cat('other',810.7)],
 expenses:[cat('defense',55.4),cat('general',185.6),cat('social',443.5),cat('other-expenses',1029.6)],
 offBudget:[{...cat('business-tax-relief',49.7),revenueImpactCategory:'business'},
  {...cat('business-social-relief',69.1),revenueImpactCategory:'contributions'}],measures:[]
};
const makeBudget=(proposals:PublishedBudget['proposals'],mode:'PARTIAL'|'AGGREGATE'='PARTIAL',
 documentary:PublishedBudget['documentary']={}):PublishedBudget=>({
 id:'nopasaran-test',budgetKey:'nopasaran-2025',version:'latest',title:'NoPasaran',description:'test',
 author:'citizen',origin:'citizen',referenceYear:2025,budgetMode:mode,documentary,
 proposals,votes:0,featured:false,featured_order:null,published_at:'2026-11-22'
});
const noPasaran=makeBudget([
 {proposalKey:'retirement',title:'Retraites',description:'Retraites',impacts:[{side:'expenses',categoryId:'social',deltaAmountBn:-40}]},
 {proposalKey:'defense',title:'Défense',description:'Défense',impacts:[{side:'expenses',categoryId:'defense',deltaAmountBn:-25}]},
 {proposalKey:'europe',title:'Europe',description:'Europe',impacts:[{side:'expenses',categoryId:'general',deltaAmountBn:-12}]},
 {proposalKey:'tax-breaks',title:'Niches',description:'Niches',impacts:[{side:'offBudget',categoryId:'business-tax-relief',deltaAmountBn:-40}]},
 {proposalKey:'social-breaks',title:'Cotisations',description:'Cotisations',impacts:[{side:'offBudget',categoryId:'business-social-relief',deltaAmountBn:6}]},
 {proposalKey:'income',title:'Revenus',description:'Revenus',impacts:[{side:'revenues',categoryId:'income',deltaAmountBn:35}]},
 {proposalKey:'property',title:'Patrimoine',description:'Patrimoine',impacts:[{side:'revenues',categoryId:'property',deltaAmountBn:20}]},
 {proposalKey:'business',title:'Entreprises',description:'Entreprises',impacts:[{side:'revenues',categoryId:'business',deltaAmountBn:13.2}]}
]);
describe('V2 accounting parity with unchanged engine',()=>{
 it('NoPasaran retains the 8 impacts, 179.2 Md€ balance improvement and 2032 balance',()=>{
  const r=computeBudget(noPasaran,reference);
  expect(r.entries).toHaveLength(8);
  expect(r.expenses.defense).toBe(30.4);
  expect(r.offBudget['business-tax-relief']).toBe(9.7);
  expect(r.revenues.business).toBeCloseTo(139.8,5);
  expect(r.revenues.contributions).toBeCloseTo(483.2,5);
  expect(r.balanceDelta).toBeCloseTo(179.2,5);
  expect(r.deficit).toBeCloseTo(-26.7,5);
  const projection=simulationService.simulate(152.5,r.balanceDelta,yearsFor(V1_ASSUMPTIONS),V1_ASSUMPTIONS);
  expect(projection.rows.find(p=>p.year===2032)?.scenario).toBe(0);
 });
 it('AGGREGATE uses declared masses without re-applying documentary proposals',()=>{
  const a=makeBudget(noPasaran.proposals,'AGGREGATE',{aggregates:[{year:2027,basis:'delta',
   revenues_bn:59,expenses_bn:-14.4,balance_delta_bn:73.4,source_url:'https://example.org'}]});
  a.origin='party';
  const r=computeBudget(a,reference);
  expect(r.balanceDelta).toBeCloseTo(73.4,5);
  expect(r.entries).toHaveLength(2);
 });
 it('citizen reuse of an aggregate does not double count its base',()=>{
  const a=makeBudget([],'AGGREGATE',{aggregates:[{year:2027,basis:'delta',
   revenues_bn:59,expenses_bn:-14.4,balance_delta_bn:73.4,source_url:'https://example.org'}]});
  a.origin='party';
  const p=[{proposalKey:'x',title:'Économies',description:'Réduire de 10 Md€',
   impacts:[{side:'expenses' as const,categoryId:'defense',deltaAmountBn:-10}]}];
  const draft=computeCitizenDraft(reference,p,a);
  expect(draft.balanceDelta).toBeCloseTo(83.4,5);
  const persisted=makeBudget(p,'PARTIAL',{citizenSource:{budgetKey:a.budgetKey,title:a.title,
    budgetMode:'AGGREGATE',aggregate:a.documentary.aggregates![0],proposals:[]}});
  expect(computeBudget(persisted,reference).deficit).toBeCloseTo(draft.deficit,5);
 });
});
