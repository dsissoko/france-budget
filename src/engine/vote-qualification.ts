import {simulationService} from './simulation';
import {QUALIFICATIONS} from './qualification';
export function voteQualification(referenceDeficit:number,balanceDelta:number,years:ReadonlyArray<number>) {
 const {assessment}=simulationService.simulate(referenceDeficit,balanceDelta,years);
 return QUALIFICATIONS[assessment.code];
}
