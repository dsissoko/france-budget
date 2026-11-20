import type {Category,Measure} from './model';

/**
 * Les règles traduisent des mesures politiques en lignes budgétaires.
 * Ce sont des INTERPRÉTATIONS documentées, jamais des évaluations opposables.
 * Toutes les unités financières sont en Md€.
 */
export type Side = 'revenues' | 'expenses' | 'offBudget';
export type Override = { revenues: Record<string, number>; expenses: Record<string, number>; offBudget?: Record<string,number> };
export type Entry = { measureId: string; side: Side; categoryId: string; amount: number; rationale: string };
export type Rule = {
  kind: 'allocate' | 'specific';
  target?: { side: Side; categoryId: string; share: number }[];
  explanation: string;
  assumption?: string;
};
export type Result = {
  entries: Entry[];
  revenues: Record<string, number>;
  expenses: Record<string, number>;
  offBudget: Record<string,number>;
  revenueTotal: number;
  expenseTotal: number;
  deficit: number;
  balanceDelta: number;
  warnings: string[];
};

/**
 * Un même thème peut solliciter des règles différentes.
 * Une nouvelle proposition simple se configure ici sans nouvelle fonction.
 * Une proposition complexe peut être branchée sur un calcul spécifique.
 */
const round = (n: number) => Math.round(n * 100) / 100;
const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);
const baseline = (items: Category[]) => Object.fromEntries(items.map(c => [c.id, c.amount]));
export type ReferenceModel = { revenues: ReadonlyArray<Category>; expenses: ReadonlyArray<Category>; offBudget: ReadonlyArray<Category>; measures: ReadonlyArray<Measure> }; 
const categoryExists = (side: Side, id: string, reference: ReferenceModel) => (side === 'revenues' ? reference.revenues : side==='expenses'?reference.expenses:reference.offBudget).some(c => c.id === id);

export function projectMeasure(measure: Measure, reference: ReferenceModel): Entry[] {
  // En production, l'affectation APU est une donnée explicite et stable.
  // Les anciennes règles V1 ne servent que de repli pour les scénarios historiques.
  if(measure.apuEntries !== undefined){
    if(!Array.isArray(measure.apuEntries)||measure.apuEntries.length===0)
      throw new Error('Affectation APU absente : '+measure.id);
    const entries=measure.apuEntries.map(entry=>{
      if(!['revenues','expenses'].includes(entry.side)||!categoryExists(entry.side,entry.categoryId,reference)||!Number.isFinite(entry.amount))
        throw new Error('Écriture APU invalide : '+measure.id);
      return {measureId:measure.id,side:entry.side,categoryId:entry.categoryId,amount:entry.amount,
        rationale:'Écriture APU explicite issue du référentiel Neon, source : '+measure.source};
    });
    const revenuesDelta=entries.filter(e=>e.side==='revenues').reduce((sum,e)=>sum+e.amount,0);
    const expensesDelta=entries.filter(e=>e.side==='expenses').reduce((sum,e)=>sum+e.amount,0);
    if(Math.abs(revenuesDelta-measure.revenueDelta)>0.001||Math.abs(expensesDelta-measure.expenseDelta)>0.001)
      throw new Error('Écritures APU et montant revendiqué incohérents : '+measure.id);
    return entries;
  }
  throw new Error('Affectation APU Neon absente : '+measure.id);
}
/**
 * Écritures sourcées, déjà validées par le regroupement documentaire.
 * Facultatives : tous les anciens appels calculent exactement comme auparavant.
 */
export type SourcedEntry = Entry;
export function calculateScenario(
 selectedIds: string[],
 citizen: Override,
 sourcedEntries: ReadonlyArray<SourcedEntry>,
 reference: ReferenceModel,
): Result {
  const {revenues,expenses,offBudget,measures}=reference;
  const revenueValues = baseline([...revenues]), expenseValues = baseline([...expenses]), offBudgetValues=baseline([...offBudget]);
  const entries: Entry[] = [];
  const warnings: string[] = [];
  for (const id of new Set(selectedIds)) {
    const measure = measures.find(m => m.id === id);
    if (!measure) { warnings.push('Mesure inconnue ignorée : ' + id); continue; }
    try {
      const projected = projectMeasure(measure,reference);
      entries.push(...projected);
      if (measure.status === 'illustration') warnings.push('Chiffrage fictif : ' + measure.title);
    } catch (err) {
      // Un budget documenté doit être cohérent en entier : jamais de solde
      // partiel si une écriture APU a été corrompue ou mal renseignée.
      throw err;
      warnings.push(String(err));
    }
  }
  // Fail closed : une affectation sourcée invalide annule entièrement
  // l'extension documentaire ; ne jamais comptabiliser un sous-ensemble silencieux.
  const existingMeasureIds=new Set(selectedIds);
  const validSourced=sourcedEntries.every(entry=>
    Boolean(entry.measureId) && !existingMeasureIds.has(entry.measureId) &&
    Boolean(entry.rationale?.trim()) &&
    Number.isFinite(entry.amount) && categoryExists(entry.side,entry.categoryId,reference)
  );
  if(!validSourced){
    if(sourcedEntries.length)warnings.push('Écritures documentaires invalides ou déjà sélectionnées : extension ignorée.');
  }else{
    entries.push(...sourcedEntries);
  }
  for (const entry of entries) {
    if(entry.side==='offBudget'){
      const category=offBudget.find(c=>c.id===entry.categoryId);
      if(!category?.revenueImpactCategory || !(category.revenueImpactCategory in revenueValues)){
        warnings.push('Manque à gagner inconnu : '+entry.categoryId);continue;
      }
      offBudgetValues[entry.categoryId]+=entry.amount;
      revenueValues[category.revenueImpactCategory]-=entry.amount;
    } else {
      const target = entry.side === 'revenues' ? revenueValues : expenseValues;
      target[entry.categoryId] += entry.amount;
    }
  }
  // Les modifications citoyennes sont des écarts au référentiel initial.
  // Elles s'ajoutent aux écritures de projection, pas aux totaux deux fois.
  for (const [side, overrides, values, categories] of [
    ['revenues', citizen.revenues, revenueValues, revenues],
    ['expenses', citizen.expenses, expenseValues, expenses],
  ] as const) {
    for (const [id, value] of Object.entries(overrides ?? {})) {
      const original = categories.find(c => c.id === id);
      if (!original || !Number.isFinite(value)) { warnings.push('Ajustement invalide : ' + side + '.' + id); continue; }
      values[id] += value - original.amount;
    }
  }
  // Off-budget = baseline already implicit in net receipts; count ONLY the delta.
  // The public-finance baseline remains exactly 2025 INSEE.
  for(const [id,value] of Object.entries(citizen.offBudget??{})){
   const category=offBudget.find(c=>c.id===id);
   if(!category||!Number.isFinite(value)||value<0||value>2*category.amount){
    warnings.push('Ajustement hors budget invalide : '+id);continue;
   }
   if(!category.revenueImpactCategory || !(category.revenueImpactCategory in revenueValues)){
    warnings.push('Catégorie de recette non définie : '+id);continue;
   }
   offBudgetValues[id]+=value-category.amount;
   revenueValues[category.revenueImpactCategory]+=category.amount-value;
  }
  if(offBudget.some(c=>offBudgetValues[c.id]<0||offBudgetValues[c.id]>2*c.amount)) warnings.push('Au moins un avantage hors budget dépasse les bornes 0–200 % de sa référence.');
  const revenueTotal = round(sum(revenueValues)), expenseTotal = round(sum(expenseValues));
  const originalBalance = sum(baseline([...revenues])) - sum(baseline([...expenses]));
  if (Object.values(revenueValues).some(v => v < 0) || Object.values(expenseValues).some(v => v < 0))
    warnings.push('Au moins un poste négatif : projection non réaliste sur cette référence.');
  const years = new Set(selectedIds.map(id => measures.find(m => m.id === id)?.year).filter(Boolean));
  if (years.size > 1) warnings.push('Mesures de millésimes différents : addition illustrative, pas un budget annuel homogène.');
  if (selectedIds.length > 1) warnings.push('Les interactions et risques de double compte ne sont pas évalués.');
  return { entries, revenues: revenueValues, expenses: expenseValues, offBudget:offBudgetValues, revenueTotal, expenseTotal,
    deficit: round(expenseTotal - revenueTotal),
    balanceDelta: round((revenueTotal - expenseTotal) - originalBalance), warnings };
}

/**
 * Rapprochement de traçabilité : vérifie si la projection comptabilise
 * le même delta que celui REVENDIQUÉ par l'auteur.
 * Une égalité n'est ni une validation macroéconomique, ni une preuve de faisabilité.
 */
export type Audit = {
  measureId: string;
  claimBalanceDelta: number;
  projectedBalanceDelta: number;
  discrepancy: number;
  status: 'reproduced' | 'gap' | 'illustration' | 'unavailable';
  explanation: string;
  entries: Entry[];
};
export function auditMeasure(measure: Measure, reference: ReferenceModel): Audit {
  const claimBalanceDelta = round(measure.revenueDelta - measure.expenseDelta);
  let entries: Entry[] = [];
  try {
    entries = projectMeasure(measure,reference);
    const projectedBalanceDelta = round(entries.reduce((s, e) =>
      s + (e.side === 'revenues' ? e.amount : -e.amount), 0));
    const discrepancy = round(projectedBalanceDelta - claimBalanceDelta);
    const status: Audit['status'] = measure.status === 'illustration'
      ? 'illustration' : Math.abs(discrepancy) <= 0.01 ? 'reproduced' : 'gap';
    return { measureId: measure.id, claimBalanceDelta, projectedBalanceDelta,
      discrepancy, status, explanation: status === 'reproduced'
        ? 'Chiffrage annoncé intégralement ventilé : égalité comptable, pas validation économique.'
        : status === 'illustration'
        ? 'Chiffrage fictif : aucune revendication officielle à valider.'
        : 'La ventilation ne reproduit pas entièrement le montant annoncé.',
      entries };
  } catch (error) {
    return { measureId: measure.id, claimBalanceDelta, projectedBalanceDelta: 0,
      discrepancy: -claimBalanceDelta, status: 'unavailable', entries,
      explanation: 'Projection indisponible : ' + String(error) };
  }
}
export function auditSelected(ids: string[], reference: ReferenceModel): Audit[] {
  const {measures}=reference;
  return [...new Set(ids)].flatMap(id => {
    const measure = measures.find(m => m.id === id);
    return measure ? [auditMeasure(measure,reference)] : [];
  });
}
