import {calculateScenario, type Override, type Result} from '../projection';

// Adapter to the existing V1 accounting engine. No change in financial formulas.
export interface AccountingService {
  calculate(selectedIds: string[], overrides?: Override): Result;
}
export const accountingService: AccountingService = {
  calculate: (selectedIds, overrides) => calculateScenario(selectedIds, overrides),
};
