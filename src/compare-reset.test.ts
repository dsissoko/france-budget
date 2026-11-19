import {describe,it,expect} from 'vitest';
import {resetCompareToReference} from './compare-reset';

describe('Comparer: Réinitialiser',()=>{
 it('restores the INSEE reference as budget A and frees slot B',()=>{
  expect(resetCompareToReference('insee-reference-2025')).toEqual({a:'insee-reference-2025',b:null});
 });
 it('uses the current canonical reference id rather than a frozen budget',()=>{
  expect(resetCompareToReference('another-reference')).toEqual({a:'another-reference',b:null});
 });
});
