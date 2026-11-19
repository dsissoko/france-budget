/**
 * Aides publiques aux entreprises : périmètre élargi du « jaune » budgétaire PLF 2027,
 * chiffres 2024, jamais à additionner aux dépenses publiques APU 2025.
 * https://www.budget.gouv.fr/documentation/file-download/34471
 */
export const ENTERPRISE_AIDS={
 categoryId:'enterprise-support',
 reportedYear:2024,
 total:166.1,
 budget:43.3,
 fiscal:49.7,
 social:69.1,
 financial:4.0,
 // The previous 2025 pedagogical reference already included this 30 Md€ slice
 // in expenses; preserve it exactly rather than fabricating a rebased 2025 account.
 legacyCountedExpense:30,
} as const;
const round=(n:number)=>Math.round(n*100)/100;
/** 2024 distribution used as an EXPLICIT V1 illustration of a 2027 policy change.
 * Financial interventions cannot safely be converted into a net budget flow.
 */
export function enterpriseAidProjection(newAidAmount:number){
 const delta=newAidAmount-ENTERPRISE_AIDS.total;
 return {
  // + aid => more outlays, fewer receipts. The 4.0 Md€ financial component is unmodelled.
  budgetExpenseDelta:round(delta*ENTERPRISE_AIDS.budget/ENTERPRISE_AIDS.total),
  taxRevenueDelta:round(-delta*ENTERPRISE_AIDS.fiscal/ENTERPRISE_AIDS.total),
  contributionRevenueDelta:round(-delta*ENTERPRISE_AIDS.social/ENTERPRISE_AIDS.total),
  unmodelledFinancialDelta:round(delta*ENTERPRISE_AIDS.financial/ENTERPRISE_AIDS.total),
 };
}
export function countedExpenseTotal(values:Readonly<Record<string,number>>):number{
 // Cross-cutting indicator: count only the pre-existing legacy 30 Md€,
 // never double-count the 2024 166.1 Md€ reporting perimeter.
 return Object.entries(values).reduce((sum,[id,value])=>
  sum+(id===ENTERPRISE_AIDS.categoryId?0:value),ENTERPRISE_AIDS.legacyCountedExpense);
}
