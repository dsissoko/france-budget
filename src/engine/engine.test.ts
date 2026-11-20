import {describe,expect,it} from 'vitest';
import {assessmentService,type QualificationCode} from './assessment';
import {QUALIFICATIONS} from './qualification';
import {simulationService,createSimulationService,PROJECTION_CALENDAR,projectionYears} from './simulation';
import {accountingService} from './accounting';
import type {Override} from '../projection';
import {expenses,revenues,sum,years} from '../data';

const samples=(values:number[])=>values.map((deficit,i)=>({year:2025+i,deficit}));
describe('AssessmentService: exhaustive public qualifications',()=>{
 const scenarios:Array<{name:string;values:number[];code:QualificationCode;label:string;tone:string}>=[
  {name:'deficit decreases',values:[100,85,70,55,40,20],code:'DEFICIT_DECREASING',label:'En bonne voie',tone:'positive'},
  {name:'increasing but decelerates',values:[100,120,135,145,152,157],code:'INCREASE_DECELERATING',label:'Ralentissement',tone:'positive'},
  {name:'deficit stable',values:[100,100,100,100,100,100],code:'DEFICIT_STABLE',label:'Stagnation',tone:'neutral'},
  {name:'steady increase',values:[100,110,120,130,140,150],code:'INCREASE_STEADY',label:'Hausse persistante',tone:'warning'},
  {name:'accelerating increase',values:[100,101,105,112,122,135],code:'INCREASE_ACCELERATING',label:'Accélération',tone:'negative'},
  {name:'balance reached',values:[100,75,50,25,10,0],code:'BALANCE_REACHED',label:'Équilibre',tone:'positive'},
  {name:'surplus reached',values:[100,75,50,20,0,-5],code:'SURPLUS_REACHED',label:'Excédent',tone:'positive'},
  {name:'deficit returned from balance',values:[0,10,20,30,40,50],code:'DEFICIT_RETURNED',label:'Déficit de retour',tone:'negative'},
  {name:'deficit returned from surplus',values:[-20,-10,0,10,20,30],code:'DEFICIT_RETURNED',label:'Déficit de retour',tone:'negative'},
  {name:'surplus returns to balance',values:[-40,-30,-20,-10,-5,0],code:'SURPLUS_TO_BALANCE',label:'Équilibre',tone:'neutral'},
  {name:'balance remains',values:[0,0,0,0,0,0],code:'BALANCE_STABLE',label:'Équilibre',tone:'positive'},
  {name:'surplus remains',values:[-10,-12,-14,-16,-18,-20],code:'SURPLUS_STABLE',label:'Excédent',tone:'positive'},
 ];
 it.each(scenarios)('$name',({values,code,label,tone})=>{
  const result=assessmentService.assess(samples(values));
  expect(result.code).toBe(code);
  expect(QUALIFICATIONS[result.code]).toMatchObject({label,tone});
 });
 it('does not call an initial one-off deficit reduction a lasting decrease',()=>{
  const budget=assessmentService.assess(samples([152.5,118.5,122.3,126.1,130,133.8]));
  expect(budget.code).toBe('INCREASE_STEADY');
  expect(QUALIFICATIONS[budget.code].tone).toBe('warning');
 });
 it('does not call a one-off decrease a deceleration',()=>{
  expect(assessmentService.assess(samples([100,70,80,90,100,110])).code).toBe('INCREASE_STEADY');
 });
 it('does not call a scenario green for merely staying below a worse reference',()=>{
  const result=assessmentService.assess(samples([80,90,100,110,120,130]));
  expect(QUALIFICATIONS[result.code].tone).not.toBe('positive');
 });
 it('avoids classification on missing or invalid annual series',()=>{
  expect(assessmentService.assess(samples([100])).code).toBe('UNDETERMINED');
  expect(assessmentService.assess(samples([100,Number.NaN])).code).toBe('UNDETERMINED');
 });
 it('uses documented near-zero tolerance',()=>{
  expect(assessmentService.assess(samples([100,50,20,10,5,.02])).code).toBe('BALANCE_REACHED');
 });
});
describe('AccountingService and SimulationService: V1 parity',()=>{
 const base=sum(expenses)-sum(revenues);
 const expected=(impact:number)=>years.map((year,i)=>({
  year,reference:Math.round(base*(1+.025*i)*10)/10,
  scenario:Math.round((base*(1+.025*i)-(year<PROJECTION_CALENDAR.applicationYear?0:impact))*10)/10,
 }));
 it('defines calendar once for all projections and the next presidential term end',()=>{
  expect(PROJECTION_CALENDAR).toMatchObject({referenceYear:2025,budgetYear:2027,applicationYear:2027,horizonYear:2032});
  expect(years).toEqual(projectionYears);
  expect(years).toEqual([2025,2026,2027,2028,2029,2030,2031,2032]);
 });
 it('does not apply any political changes to 2025 or 2026, then applies them in 2027',()=>{
  const result=simulationService.simulate(base,37.8,years);
  expect(result.rows.slice(0,2).every(r=>r.scenario===r.reference)).toBe(true);
  expect(result.rows.find(r=>r.year===2027)?.scenario).toBe(Math.round((base*(1+.025*2)-37.8)*10)/10);
  expect(result.rows[result.rows.length-1].year).toBe(2032);
  expect(result.assessment.code).toBe('INCREASE_STEADY');
 });
 it('anchors calculations to calendar years, not displayed array positions',()=>{
  const subset=simulationService.simulate(base,1,[2027,2030,2032]);
  expect(subset.rows).toEqual([2027,2030,2032].map(year=>({
   year,
   reference:Math.round(base*(1+.025*(year-2025))*10)/10,
   scenario:Math.round((base*(1+.025*(year-2025))-1)*10)/10,
  })));
 });
 it('delegates the existing accounting calculations without changing them',()=>{
  expect(accountingService.calculate([]).deficit).toBeCloseTo(152.5,8);
 });
 it.each([-80,-20,0,20,100,200])('preserves V1 accounting and 2027 application for balance delta %i',impact=>{
  const result=simulationService.simulate(base,impact,years);
  expect(result.rows).toEqual(expected(impact));
  expect(result.modelId).toBe('mechanical-v1');
 });
 it.each([
  {name:'RN',ids:['rn-vat','rn-social','rn-agencies'],override:{revenues:{},expenses:{}},deficit:152.65,expected2030:171.7},
  {name:'LFI',ids:['lfi-wealth','lfi-school','lfi-green'],override:{revenues:{},expenses:{}},deficit:148.7,expected2030:167.8},
  {name:'Horizons',ids:['hor-admin','hor-tax'],override:{revenues:{},expenses:{}},deficit:151.5,expected2030:170.6},
  {name:'Citizen defense',ids:['lfi-wealth','lfi-school','lfi-green'],override:{revenues:{},expenses:{defense:31}},deficit:114.7,expected2030:133.8},
  {name:'Citizen complementary',ids:['lfi-wealth','lfi-school','lfi-green'],override:{revenues:{},expenses:{social:394}},deficit:142.7,expected2030:161.8},
 ])('reconciles production scenario fixture $name and preserves old rounding',({ids,override,deficit,expected2030})=>{
  const result=accountingService.calculate(ids,override as Override);
  expect(result.deficit).toBeCloseTo(deficit,2);
  const projected=simulationService.simulate(base,result.balanceDelta,years);
  expect(projected.rows[5].scenario).toBe(expected2030);
  expect(projected.assessment.code).toBe('INCREASE_STEADY');
  for(const [i,row] of projected.rows.entries()){
   expect(row.reference).toBe(Math.round(base*(1+.025*i)*10)/10);
   expect(row.scenario).toBe(Math.round((base*(1+.025*i)-(row.year<2027?0:result.balanceDelta))*10)/10);
  }
 });
 it('supports an optional future impact adapter without changing UI contracts',()=>{
  const model=createSimulationService({apply:()=>3});
  const enhanced=model.simulate(base,0,years);
  expect(enhanced.rows[0].scenario).toBeCloseTo(base+3,1);
  expect(enhanced.rows).toHaveLength(years.length);
 });
});
