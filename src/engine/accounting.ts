import {calculateScenario, type Override, type Result, type SourcedEntry} from '../projection';

// Un moteur comptable commun : les écritures sourcées sont un paramètre optionnel.
// Les budgets citoyens et les anciens budgets politiques conservent le même parcours.
export interface AccountingService {
  calculate(selectedIds: string[], overrides?: Override, sourcedEntries?: ReadonlyArray<SourcedEntry>): Result;
}
export const accountingService: AccountingService = {
  calculate: (selectedIds, overrides, sourcedEntries) => calculateScenario(selectedIds, overrides, sourcedEntries),
};
