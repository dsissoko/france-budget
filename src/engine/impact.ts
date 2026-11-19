// Future impact models can refine the yearly deficit, with explicit assumptions.
// The V1 implementation is intentionally neutral: existing financial values are preserved.
export interface ImpactContext {
  year: number;
  referenceDeficit: number;
  scenarioDeficit: number;
}
export interface ImpactModel {
  id: string;
  version: string;
  apply(context: Readonly<ImpactContext>): number;
}
export interface ImpactService {
  apply(context: Readonly<ImpactContext>): number;
}
export const noImpactModel: ImpactModel = {
  id: 'no-indirect-effects',
  version: '1',
  apply: () => 0,
};
export const impactService: ImpactService = {
  apply: context => noImpactModel.apply(context),
};
