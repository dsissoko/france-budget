import type {Category} from './data';

// A comparison shows only lines where A and B differ. The reference is
// displayed alongside changed lines for context but is not a filter criterion.
export function differentBudgetLines(
 items:ReadonlyArray<Category>,
 a:Readonly<Record<string,number>>,
 b:Readonly<Record<string,number>>,
 tolerance=0.005,
):Category[]{
 return items.filter(item=>{
  const valueA=a[item.id]??item.amount;
  const valueB=b[item.id]??item.amount;
  return Number.isFinite(valueA)&&Number.isFinite(valueB)&&Math.abs(valueA-valueB)>tolerance;
 });
}
