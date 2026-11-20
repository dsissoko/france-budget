import {simulationService,type SimulationParameters} from './simulation';
import {QUALIFICATIONS} from './qualification';
export function voteQualification(referenceDeficit:number,balanceDelta:number,years:ReadonlyArray<number>,parameters?:SimulationParameters) {
 const {assessment}=simulationService.simulate(referenceDeficit,balanceDelta,years,parameters);
 return QUALIFICATIONS[assessment.code];
}
