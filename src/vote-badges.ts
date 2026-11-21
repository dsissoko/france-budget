import {budgetMaturity,type BudgetMaturity} from './budget-maturity';

/**
 * Each indicator is independent. No 2032 evaluation for documentary-only
 * programmes. A maturity badge requires a valid explicit status.
 */
export function visibleVoteBadges(b:BudgetMaturity & {documentaryOnly?:boolean}) {
 return {trajectory:!b.documentaryOnly, maturity:budgetMaturity(b)!==null};
}
