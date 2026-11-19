import {describe,expect,it} from 'vitest';
import {simulationService,projectionYears} from '../engine/simulation';
import {buildSlopeGraph} from './slopegraph';

const projection=(delta:number)=>simulationService.simulate(152.5,delta,projectionYears);

describe('responsive slopegraph geometry',()=>{
 it('draws two series for an individual budget, three for A/B',()=>{
  const solo=buildSlopeGraph(projection(2.84));
  const compare=buildSlopeGraph(projection(2.84),projection(3.8));
  expect(solo.series.map(x=>x.id)).toEqual(['reference','a']);
  expect(compare.series.map(x=>x.id)).toEqual(['reference','a','b']);
  expect(solo.series[0].points.map(x=>x.year)).toEqual([2025,2026,2027,2032]);
 });
 it('uses exactly one series in the factual Comprendre reference',()=>{
  const graph=buildSlopeGraph(projection(0),undefined,true);
  expect(graph.series.map(x=>x.id)).toEqual(['reference']);
  expect(graph.deltas.a).toBeNull();
 });
 it('keeps a common value scale; overlapping data never get fake separation',()=>{
  const graph=buildSlopeGraph(projection(0),projection(0));
  const ends=graph.series.map(s=>s.points[s.points.length-1]);
  expect(new Set(ends.map(v=>v.y)).size).toBe(1);
  expect(graph.max).toBeGreaterThan(graph.min);
 });
 it('keeps the 2027 application discontinuity on the chart',()=>{
  const graph=buildSlopeGraph(projection(37.8));
  const ref=graph.series[0].points;
  const scenario=graph.series[1].points;
  expect(scenario[0].value).toBe(ref[0].value);
  expect(scenario[1].value).toBe(ref[1].value);
  expect(ref[2].value-scenario[2].value).toBeCloseTo(37.8,1);
 });
 it('shows the exact monetary effect at 2032 without exaggeration',()=>{
  const graph=buildSlopeGraph(projection(2.84),projection(-4));
  expect(graph.endYear).toBe(2032);
  expect(graph.reference2032).toBe(179.2);
  expect(graph.deltas.a).toBeCloseTo(2.9,1);
  expect(graph.deltas.b).toBeCloseTo(-4,1);
  expect(graph.series[0].points.at(-1)?.x).toBe(332);
 });
 it('rejects data series that cannot be compared coherently',()=>{
  const bad=projection(4);
  bad.rows=bad.rows.filter(r=>r.year!==2027);
  expect(()=>buildSlopeGraph(projection(2),bad)).toThrow('mismatched years');
 });
});
