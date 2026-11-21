import {simulationService,type SimulationParameters} from './simulation';
import {projectionVerdict} from './projection-verdict';
export function voteQualification(referenceDeficit:number,balanceDelta:number,years:ReadonlyArray<number>,parameters?:SimulationParameters) {
 const projection=simulationService.simulate(referenceDeficit,balanceDelta,years,parameters);
 return projectionVerdict(projection);
}
