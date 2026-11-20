import {accountingService} from './accounting';
import {consolidatePartyProposal,type PartySourceLine} from './party-proposals';
import {expenses,revenues} from '../data';
import type {Entry,Override,Result} from '../projection';

/**
 * Adaptateur optionnel des propositions documentaires vers le moteur V1.
 * Un groupe n'est jamais une écriture supplémentaire : seules ses lignes
 * sourcées et ventilées sont transmises à la comptabilité.
 */
export function calculateDocumentedBudget(
 groups:ReadonlyArray<{id:string;lines:ReadonlyArray<PartySourceLine>}>,
 overrides:Override={revenues:{},expenses:{}},
 legacySelectedIds:ReadonlyArray<string>=[]
):Result{
 const lines=new Set<string>();
 const groupIds=new Set<string>();
 const entries:Entry[]=[];
 for(const group of groups){
   if(!group.id||groupIds.has(group.id))throw Error('Groupe en double ou absent : '+group.id);
   groupIds.add(group.id);
   const projection=consolidatePartyProposal(group.id,group.lines,{
     revenues:revenues.map(x=>x.id), expenses:expenses.map(x=>x.id)
   });
   for(const line of group.lines){
     // Une même mesure source ne peut appartenir à deux propositions.
     if(lines.has(line.id))throw Error('Mesure source comptée deux fois : '+line.id);
     lines.add(line.id);
   }
   for(const item of projection.entries){
     // Préfixe isolant les identifiants du référentiel documentaire des règles V1.
     const measureId='source:'+item.sourceId;
     if(legacySelectedIds.includes(measureId))throw Error('Source déjà dans sélection V1 : '+item.sourceId);
     entries.push({
       measureId,side:item.side,categoryId:item.categoryId,amount:item.amount,
       rationale:'Ventilation APU explicitement revue — source '+item.sourceId
     });
   }
 }
 return accountingService.calculate([...legacySelectedIds],overrides,entries);
}
