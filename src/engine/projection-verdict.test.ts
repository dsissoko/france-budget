import {describe,expect,it} from 'vitest';
import {projectionVerdict} from './projection-verdict';
import {simulationService,projectionYears,type ProjectionResult} from './simulation';

const mk=(reference:number[],scenario:number[],start=2025):ProjectionResult=>({
  modelId:'test',
  assumptions:{referenceYear:start,budgetYear:start+2,applicationYear:start+2,horizonYear:start+reference.length-1,baselineRatePerIndex:.025},
  rows:reference.map((v,i)=>({year:start+i,reference:v,scenario:scenario[i]})),
  assessment:{code:'UNDETERMINED',direction:'stable',momentum:'steady'},
  warnings:[]
});
const reference=[100,105,110,115,120,125,130,135];

describe('2032 public budget verdict',()=>{
  it('qualifies growing reference as degradation',()=>{
    expect(projectionVerdict(mk(reference,reference))).toMatchObject({label:'Dégradation',tone:'negative'});
  });
  it('calls a better 2032 result with a rising trajectory relative improvement',()=>{
    expect(projectionVerdict(mk(reference,[100,105,96,100,104,108,112,116]))).toMatchObject({label:'Amélioration relative',tone:'warning'});
  });
  it('calls a better result with flat or falling post-application trajectory redressement',()=>{
    for(const end of [90,80]){
      const trajectory=end===90?[100,105,90,90,90,90,90,90]:[100,105,90,88,86,84,82,80];
      expect(projectionVerdict(mk(reference,trajectory))).toMatchObject({label:'Redressement',tone:'positive'});
    }
  });
  it('marks worse 2032 deficit as degradation even while declining',()=>{
    expect(projectionVerdict(mk(reference,[100,105,155,151,147,143,139,136]))).toMatchObject({label:'Dégradation',tone:'negative'});
  });
  it('does not call equal and flat trajectory a redressement',()=>{
    const flat=[100,100,100,100,100,100,100,100];
    expect(projectionVerdict(mk(flat,flat))).toMatchObject({label:'Non qualifié',tone:'neutral'});
  });
  it('does not invent verdict with invalid projection',()=>{
    expect(projectionVerdict(mk([100],[100]))).toMatchObject({label:'Non qualifié',tone:'neutral'});
  });
  it('checks current mechanical model without changing numeric outputs',()=>{
    const projection=simulationService.simulate(152.5,1,projectionYears);
    expect(projectionVerdict(projection)).toMatchObject({label:'Amélioration relative',tone:'warning'});
    expect(projection.rows[projection.rows.length-1]?.scenario).toBeCloseTo(178.2,1);
  });
});
