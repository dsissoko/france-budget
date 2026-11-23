import {describe,it,expect} from 'vitest';
import {readDraftProposals,proposalEntries,reportedAggregate,validExclusiveProposals,measuredProposals,impactedProposals,declaredAmountForDisplay,hasQualifiedBudgetImpact,updateImpact,computeBudget,computeCitizenDraft,comparisonBudgets,type PublishedBudget} from './v2-budget';
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
  expect(r.offBudget['business-tax-relief']).toBeCloseTo(9.7,5);
  expect(r.revenues.business).toBeCloseTo(139.8,5);
  expect(r.revenues.contributions).toBeCloseTo(483.2,5);
  expect(r.balanceDelta).toBeCloseTo(179.2,5);
  expect(r.deficit).toBeCloseTo(-26.7,5);
  const projection=simulationService.simulate(152.5,r.balanceDelta,yearsFor(V1_ASSUMPTIONS),V1_ASSUMPTIONS);
  expect(Math.abs(projection.rows.find(p=>p.year===2032)?.scenario??999)).toBeLessThan(0.05);
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

describe('Party declared quantified proposals - display without accounting',()=>{
 const base={id:'test',budgetKey:'lfi-2027',version:'latest',origin:'party' as const,
 title:'Budget déclaré',description:'Programme',referenceYear:2025,
 budgetMode:'PARTIAL' as const,documentary:{},votes:0,featured:false,featured_order:null,
 proposals:[
  {proposalKey:'sourced',title:'Recette annoncée',description:'',impacts:[],
   claimedAmountBn:'106.400',sourceUrl:'https://example.org/source.pdf',sourceStatus:'publié'},
  {proposalKey:'preliminary',title:'Inventaire non validé',description:'',impacts:[],
   claimedAmountBn:'99.000',sourceUrl:'https://example.org/source.pdf',
   sourceStatus:'preliminary_source_inventory_unverified'}
 ]};
 it('shows source-qualified amounts but not preliminary inventory',()=>{
  const shown=measuredProposals(base);
  expect(shown.map(x=>x.proposalKey)).toEqual(['sourced']);
  expect(declaredAmountForDisplay(shown[0])).toBe(106.4);
  expect(impactedProposals(base)).toEqual([]);
 });
 it('never injects declared amounts into engine or impact qualification',()=>{
  const result=computeBudget(base,reference);
  expect(result.entries).toEqual([]);
  expect(result.balanceDelta).toBe(0);
  expect(hasQualifiedBudgetImpact(base)).toBe(false);
 });
});

describe('V2 pivot-consolidation display and source-count',()=>{
 const grouped={...makeBudget([]),origin:'party' as const,proposals:[
  {proposalKey:'src-19',title:'Enseignants',description:'',claimedAmountBn:'0.500',sourceStatus:'grouped_into_pivot',sourceUrl:'https://example.org',impacts:[]},
  {proposalKey:'src-21',title:'Universités',description:'',claimedAmountBn:'3.500',sourceStatus:'grouped_into_pivot',sourceUrl:'https://example.org',impacts:[]},
  {proposalKey:'pivot-expenses-education',title:'Éducation',description:'Consolidation',sourceOrigin:'pivot_consolidation',notes:'members=src-19:0.500|src-21:3.500',impacts:[{side:'expenses' as const,categoryId:'education',deltaAmountBn:4}]}
 ]};
 it('renders one grouped row and counts both source measures',async()=>{
  const {pivotGroupMembers,measuredSourceCount}=await import('./v2-budget');
  expect(measuredProposals(grouped).map(p=>p.proposalKey)).toEqual(['pivot-expenses-education']);
  expect(measuredSourceCount(grouped)).toBe(2);
  expect(pivotGroupMembers(grouped,grouped.proposals[2]).map(x=>x.proposalKey)).toEqual(['src-19','src-21']);
 });
});


describe('PR 145 grouped allocation inside V2 published AGGREGATE',()=>{
 const group={id:'citizen-04',title:'Fiscalité des entreprises',
  description:'Un programme annoncé',sourceUrl:'https://example.org/source.pdf',
  sourceCount:2,
  sourceLines:[
   {id:'src-1',title:'Mesure A',description:'',claimedAmountBn:10,direction:'revenue_increase',sourceUrl:'https://example.org/source.pdf',sourcePage:13,sourceStatus:'validated',impactDescription:''},
   {id:'src-2',title:'Mesure B',description:'',claimedAmountBn:9.9,direction:'revenue_increase',sourceUrl:'https://example.org/source.pdf',sourcePage:14,sourceStatus:'validated',impactDescription:''}
  ],
  citizenImpacts:[{side:'revenues',categoryId:'business',label:'Fiscalité des entreprises',
   claimedAmountBn:19.9,status:'claimed_allocated_in_aggregate',rationale:'Justifié',simulated:true}]
 };
 const aggregate=makeBudget([
  {proposalKey:'src-1',title:'Mesure A',description:'',claimedAmountBn:'10',sourceUrl:'https://example.org/source.pdf',impacts:[]},
  {proposalKey:'src-2',title:'Mesure B',description:'',claimedAmountBn:'9.9',sourceUrl:'https://example.org/source.pdf',impacts:[]}
 ],'AGGREGATE',{
  aggregates:[{year:2027,basis:'delta',revenues_bn:106.4,expenses_bn:81.7,
   balance_delta_bn:24.7,source_url:'https://example.org/source.pdf'}],
  claimedAllocations:[{side:'revenues',categoryId:'business',amount:19.9}],
  citizenGroups:[group]
 });
 aggregate.origin='party';
 it('displays one citizen group sourced by two measures',async()=>{
  const {pivotGroupMembers,measuredSourceCount}=await import('./v2-budget');
  const shown=measuredProposals(aggregate);
  expect(shown).toHaveLength(1);
  expect(measuredSourceCount(aggregate)).toBe(2);
  expect(pivotGroupMembers(aggregate,shown[0]).map(p=>p.proposalKey)).toEqual(['src-1','src-2']);
  expect(shown[0].impacts).toEqual([{side:'revenues',categoryId:'business',deltaAmountBn:19.9}]);
 });
 it('allocates claim internally without creating extra revenue',()=>{
  const r=computeBudget(aggregate,reference);
  expect(r.revenues.business).toBeCloseTo(106.5,5);
  expect(r.revenues.other).toBeCloseTo(810.7+86.5,5);
  expect(r.balanceDelta).toBeCloseTo(24.7,5);
  expect(r.entries).toHaveLength(3);
 });
 it('preserves the same allocation when a citizen copies the aggregate',()=>{
  const copied=makeBudget([],'PARTIAL',{citizenSource:{
   budgetKey:aggregate.budgetKey,title:aggregate.title,budgetMode:'AGGREGATE',
   aggregate:aggregate.documentary.aggregates![0],
   claimedAllocations:aggregate.documentary.claimedAllocations,
   proposals:aggregate.proposals
  }});
  expect(computeBudget(copied,reference).revenues.business).toBeCloseTo(106.5,5);
  expect(computeBudget(copied,reference).balanceDelta).toBeCloseTo(24.7,5);
 });
});


describe('V2 Comparer political budget visibility regression',()=>{
 const budget=(id:string,origin:'party'|'citizen'|'educational',featured=false):PublishedBudget=>({
  ...makeBudget([]),id,budgetKey:id,title:id,origin,featured,featured_order:null
 });
 it('shows every political budget even without featured flag and without a nine-item cap',()=>{
  const parties=Array.from({length:15},(_,i)=>budget('party-'+i,'party'));
  const list=comparisonBudgets([...parties,budget('citizen-featured','citizen',true),budget('citizen-other','citizen')],null);
  expect(list.filter(b=>b.origin==='party')).toHaveLength(15);
  expect(list.some(b=>b.id==='citizen-featured')).toBe(true);
  expect(list.some(b=>b.id==='citizen-other')).toBe(false);
 });
 it('keeps citizen champion even when not featured, excludes educational duplicates',()=>{
  const list=comparisonBudgets([budget('champion','citizen'),budget('insee','educational')],'champion');
  expect(list.map(b=>b.id)).toEqual(['champion']);
 });
});
