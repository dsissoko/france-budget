// Types et fonctions de présentation : aucune donnée budgétaire embarquée.
export type Category={id:string;label:string;amount:number;canonical:string;description:string;revenueImpactCategory?:string};
export type Measure={id:string;party:string;theme:string;title:string;revenueDelta:number;expenseDelta:number;source:string;year:number;status:'publié'|'illustration';description:string;referenceOrigin?:'neon';apuEntries?:Array<{side:'revenues'|'expenses';categoryId:string;amount:number}>};
export type Party=string;
export const sum=(items:ReadonlyArray<Category>)=>items.reduce((a,i)=>a+i.amount,0);
export const currency=(v:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(v)+' Md€';
