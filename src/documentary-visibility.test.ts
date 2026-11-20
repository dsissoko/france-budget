import {describe,expect,it} from 'vitest';
import {documentaryLineIsCalculated} from './documentary-visibility';

describe('Visibilité générique des propositions comptables et documentaires',()=>{
 it('supprime le doublon quand la même mesure est calculée et documentée',()=>{
   expect(documentaryLineIsCalculated({accountingMeasureId:'m1'},['m1'])).toBe(true);
 });
 it('conserve les lignes encore en revue et les mesures hors scénario',()=>{
   expect(documentaryLineIsCalculated({accountingMeasureId:null},['m1'])).toBe(false);
   expect(documentaryLineIsCalculated({accountingMeasureId:'m2'},['m1'])).toBe(false);
 });
 it('ne lie pas par erreur un identifiant d’un autre budget',()=>{
   expect(documentaryLineIsCalculated({accountingMeasureId:'m1'},[])).toBe(false);
 });
});
