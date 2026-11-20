import {describe,it,expect} from 'vitest';
import {budgetCoverage} from './party-coverage';
const b=(selected:string[],year=2027)=>({origin:'party',scenario:{picked:selected,claimedTotals:{year,revenuesBn:106.4,expensesBn:81.7,balanceDeltaBn:24.7,sourceUrl:'https://example.org/source.pdf'}},documentaryProposals:[{year,sourceLines:[{id:1,accountingMeasureId:'one'},{id:2,accountingMeasureId:null}]}]});
describe('Qualification des budgets politiques partiellement calculés',()=>{
 it('interdit une conclusion globale si une mesure source manque',()=>expect(budgetCoverage(b(['one'])).incomplete).toBe(true));
 it('sépare le solde revendiqué de celui du sous-ensemble',()=>expect(budgetCoverage(b(['one'])).claim?.balanceDeltaBn).toBe(24.7));
 it('autorise un budget de citoyens sans catalogue documentaire',()=>expect(budgetCoverage({origin:'citizen',scenario:{picked:[]}}).incomplete).toBe(false));
 it('ne mélange pas les millésimes',()=>expect(budgetCoverage({...b(['one']),documentaryProposals:[{year:2026,sourceLines:[{id:8}]},{year:2027,sourceLines:[{id:1,accountingMeasureId:'one'},{id:2}]}]}).total).toBe(2));
 it('ne bloque pas un catalogue entièrement lié et sélectionné',()=>expect(budgetCoverage({...b(['one']),documentaryProposals:[{year:2027,sourceLines:[{id:1,accountingMeasureId:'one'}]}]}).incomplete).toBe(false));
});
