import {describe,it,expect} from 'vitest';
import {resetCompareSelection} from './compare-reset';

describe('Comparer: Réinitialiser',()=>{
 it('clears both slots so the next budget can be selected as A',()=>{
  expect(resetCompareSelection()).toEqual({a:null,b:null});
 });
 it('does not implicitly preselect the INSEE reference',()=>{
  const selection=resetCompareSelection();
  expect(selection.a).toBeNull();
  expect(selection.b).toBeNull();
 });
});
