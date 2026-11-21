/** Neutral, current-year budget impact (not a judgement on political merit). */
export function voteBudgetImpact(deficit:number,balanceDelta:number,documentaryOnly=false){
 if(documentaryOnly||!Number.isFinite(deficit)||!Number.isFinite(balanceDelta))return {label:'Non chiffré',tone:'neutral',description:'Aucun effet budgétaire calculable.'};
 if(deficit < -1)return {label:'Excédent',tone:'positive',description:'Le solde final simulé est excédentaire.'};
 if(Math.abs(balanceDelta)<=1)return {label:'Déficit stable',tone:'neutral',description:'Variation du solde inférieure ou égale à 1 Md€ par rapport à la référence.'};
 if(balanceDelta>1)return {label:'Déficit réduit',tone:'positive',description:'Amélioration du solde par rapport à la référence INSEE ; simulation indicative.'};
 return {label:'Déficit aggravé',tone:'negative',description:'Dégradation du solde par rapport à la référence INSEE ; simulation indicative.'};
}
