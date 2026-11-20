/** Whether a sourced proposal is already part of the selected accounting scenario. */
export const documentaryLineIsCalculated = (
  line: { accountingMeasureId?: string | null },
  selected: readonly string[],
): boolean => Boolean(line.accountingMeasureId && selected.includes(line.accountingMeasureId));
