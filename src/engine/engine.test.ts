import {describe,expect,it} from 'vitest';
import {assessmentService,type QualificationCode} from './assessment';
import {QUALIFICATIONS} from './qualification';
import {simulationService,createSimulationService} from './simulation';
import {accountingService} from './accounting';
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
  scenario:Math.round((base*(1+.025*i)-(i===0?0:impact))*10)/10,
 }));
 it('delegates the existing accounting calculations without changing them',()=>{
  expect(accountingService.calculate([]).deficit).toBeCloseTo(152.5,8);
 });
 it.each([-80,-20,0,20,100,200])('preserves every old trajectory point for balance delta %i',impact=>{
  const result=simulationService.simulate(base,impact,years);
  expect(result.rows).toEqual(expected(impact));
  expect(result.modelId).toBe('mechanical-v1');
 });
 it('supports an optional future impact adapter without changing UI contracts',()=>{
  const model=createSimulationService({apply:()=>3});
  const enhanced=model.simulate(base,0,years);
  expect(enhanced.rows[0].scenario).toBeCloseTo(base+3,1);
  expect(enhanced.rows).toHaveLength(years.length);
 });
});
