/**
 * Consolidation mécanique d'une proposition de parti à partir de lignes sourcées.
 * Aucune inférence économique : les écritures sont attribuées manuellement.
 * Fonction pure et réutilisable, sans dépendance à Neon ni à l'interface.
 */
export type PublicSide='revenues'|'expenses';
export type ClaimedDirection='revenue_increase'|'revenue_decrease'|'expense_increase'|'expense_decrease';
export type ApuDecision='calculate'|'non_chiffrable_apu';

export interface PartySourceLine {
  id:string;
  groupId:string;
  direction:ClaimedDirection;
  amount:number;
  sourceUrl:string;
  /** Décision éditoriale manuelle, jamais calculée automatiquement. */
  apuDecision:ApuDecision;
  /** Motif obligatoire lorsqu'une mesure est exclue du calcul APU. */
  apuReason?:string;
  /** Rattachement comptable explicite si la mesure est calculable. */
  allocation?:ReadonlyArray<{side:PublicSide;categoryId:string;amount:number}>;
  /** Optionnel : identifiant canonique d'un élément déjà compté dans une autre ligne. */
  overlapsWith?:string;
}
export interface ProposalProjection {
  groupId:string;
  sourceLineCount:number;
  excludedLineCount:number;
  revenueDelta:number;
  expenseDelta:number;
  entries:Array<{sourceId:string;side:PublicSide;categoryId:string;amount:number}>;
  warnings:string[];
}
const rnd=(n:number)=>Math.round(n*1000)/1000;
function expectedSignedFlow(line:PartySourceLine):{side:PublicSide;delta:number}{
  switch(line.direction){
    case 'revenue_increase':return {side:'revenues',delta:line.amount};
    case 'revenue_decrease':return {side:'revenues',delta:-line.amount};
    case 'expense_increase':return {side:'expenses',delta:line.amount};
    case 'expense_decrease':return {side:'expenses',delta:-line.amount};
  }
}
/**
 * Fail closed : aucune ligne incomplète ne se transforme en effet APU fictif.
 * Les groupes ne sont que des vues : seules les écritures sources calculent le solde.
 */
export function consolidatePartyProposal(groupId:string,lines:ReadonlyArray<PartySourceLine>,validCategories:{
  revenues:ReadonlyArray<string>;expenses:ReadonlyArray<string>;
}):ProposalProjection{
  if(!groupId||lines.length===0)throw Error('Groupe vide');
  const ids=new Set<string>();
  const entries:ProposalProjection['entries']=[];
  const warnings:string[]=[];
  let excludedLineCount=0;
  for(const line of lines){
    if(line.groupId!==groupId)throw Error('Ligne hors groupe : '+line.id);
    if(!line.id||ids.has(line.id))throw Error('Identifiant source dupliqué : '+line.id);
    ids.add(line.id);
    if(!line.sourceUrl.startsWith('https://'))throw Error('Source officielle HTTPS absente : '+line.id);
    if(!Number.isFinite(line.amount)||line.amount<0)throw Error('Montant source invalide : '+line.id);
    if(line.apuDecision==='non_chiffrable_apu'){
      if(!line.apuReason?.trim())throw Error('Justification APU manquante : '+line.id);
      if(line.allocation?.length)throw Error('Une ligne exclue ne peut recevoir d’écritures : '+line.id);
      excludedLineCount++;
      warnings.push('Hors calcul APU : '+line.id+' — '+line.apuReason);
      continue;
    }
    if(line.apuDecision!=='calculate')throw Error('Décision APU absente : '+line.id);
    if(line.overlapsWith)throw Error('Risque de double compte non résolu : '+line.id);
    if(!line.allocation?.length)throw Error('Affectation APU absente : '+line.id);
    const expected=expectedSignedFlow(line);
    let assigned=0;
    for(const entry of line.allocation){
      if(entry.side!==expected.side)throw Error('Nature de flux incohérente : '+line.id);
      if(!validCategories[entry.side].includes(entry.categoryId))throw Error('Catégorie inconnue : '+entry.categoryId);
      if(!Number.isFinite(entry.amount)||Math.sign(entry.amount)!==Math.sign(expected.delta)&&expected.delta!==0&&entry.amount!==0)
        throw Error('Signe de flux incohérent : '+line.id);
      assigned+=entry.amount;
      entries.push({sourceId:line.id,side:entry.side,categoryId:entry.categoryId,amount:rnd(entry.amount)});
    }
    if(Math.abs(assigned-expected.delta)>0.001)throw Error('Ventilation non équilibrée : '+line.id);
  }
  const revenueDelta=rnd(entries.filter(x=>x.side==='revenues').reduce((s,x)=>s+x.amount,0));
  const expenseDelta=rnd(entries.filter(x=>x.side==='expenses').reduce((s,x)=>s+x.amount,0));
  return {groupId,sourceLineCount:lines.length,excludedLineCount,revenueDelta,expenseDelta,entries,warnings};
}
