import type {BudgetMaturity} from './budget-maturity';

/**
 * Each indicator is independent. No 2032 evaluation for documentary-only
 * programmes, and no maturity tag for citizen budgets.
 */
export function visibleVoteBadges(b:BudgetMaturity & {documentaryOnly?:boolean}) {
 return {trajectory:!b.documentaryOnly, maturity:b.origin==='party'};
}
