import {describe,expect,it} from 'vitest';
import {measures,revenues,expenses,type Measure} from '../data';
import {calculateScenario,projectMeasure,type Override} from '../projection';

/**
 * #22 — migration safeguard.
 * Simulate the same historic published measures first with legacy rules and
 * then with explicit normalized APU entries, as loaded by GET /api/reference.
 *
 * NOTE: These tests prove computational parity, NOT documentary correctness
 * of the political amounts or independent verification of the economic model.
 * The future Neon migration must supply its reviewed entries separately.
 */
const publishedIds=['rn-vat','rn-social','rn-agencies','lfi-school','lfi-green'] as const;

function withNormalizedPublishedMeasures<T>(callback:()=>T):T {
  const originals=new Map<number,Measure>();
  try {
    for(const id of publishedIds) {
      const index=measures.findIndex(measure=>measure.id===id);
      if(index<0)throw new Error('Missing historical fixture: '+id);
      const original=measures[index];
      if(original.status!=='publié')throw new Error('Unexpected non-published fixture: '+id);
      if(original.apuEntries!==undefined)throw new Error('Fixture already normalized; update parity baseline: '+id);
      const entries=projectMeasure(original).map(entry=>{
        if(entry.side==='offBudget')throw new Error('Unsupported legacy off-budget fixture: '+id);
        return {side:entry.side,categoryId:entry.categoryId,amount:entry.amount};
      });
      originals.set(index,original);
      measures[index]={...original,apuEntries:entries};
    }
    return callback();
  }finally{
    for(const [index,original] of originals)measures[index]=original;
  }
}

describe('Issue #22 — parité de migration des règles historiques vers les écritures APU',()=>{
  it('conserve la situation de référence lorsqu’aucune mesure n’est activée',()=>{
    const before=calculateScenario([]);
    const after=withNormalizedPublishedMeasures(()=>calculateScenario([]));
    expect(after.revenueTotal).toBe(before.revenueTotal);
    expect(after.expenseTotal).toBe(before.expenseTotal);
    expect(after.deficit).toBe(before.deficit);
    expect(after.balanceDelta).toBe(0);
  });

  for(const ids of [
    ['rn-vat'],
    ['rn-social'],
    ['rn-agencies'],
    ['lfi-school'],
    ['lfi-green'],
    ['rn-vat','rn-social','rn-agencies'],
    ['lfi-school','lfi-green'],
    [...publishedIds],
  ]) {
    it('préserve exactement les montants et écritures pour '+ids.join(' + '),()=>{
      const before=calculateScenario(ids);
      const after=withNormalizedPublishedMeasures(()=>calculateScenario(ids));
      expect(after.revenues).toEqual(before.revenues);
      expect(after.expenses).toEqual(before.expenses);
      expect(after.offBudget).toEqual(before.offBudget);
      expect(after.revenueTotal).toBe(before.revenueTotal);
      expect(after.expenseTotal).toBe(before.expenseTotal);
      expect(after.balanceDelta).toBe(before.balanceDelta);
      expect(after.deficit).toBe(before.deficit);
      // The normalized route carries different explanatory text, but exactly
      // the same signed posting amounts, sides and category allocation.
      const posting=(result:ReturnType<typeof calculateScenario>)=>result.entries
        .map(e=>[e.measureId,e.side,e.categoryId,e.amount]);
      expect(posting(after)).toEqual(posting(before));
    });
  }

  it('préserve les ajustements citoyens combinés à des propositions politiques',()=>{
    const vat=revenues.find(x=>x.id==='vat');
    const health=expenses.find(x=>x.id==='health');
    if(!vat||!health)throw new Error('Missing canonical citizen categories');
    const overrides:Override={
      revenues:{vat:vat.amount+4.5},
      expenses:{health:health.amount+2.25},
    };
    const before=calculateScenario(['rn-vat','lfi-green'],overrides);
    const after=withNormalizedPublishedMeasures(()=>calculateScenario(['rn-vat','lfi-green'],overrides));
    expect(after.revenues).toEqual(before.revenues);
    expect(after.expenses).toEqual(before.expenses);
    expect(after.revenueTotal).toBe(before.revenueTotal);
    expect(after.expenseTotal).toBe(before.expenseTotal);
    expect(after.deficit).toBe(before.deficit);
    expect(after.balanceDelta).toBe(before.balanceDelta);
  });
});
