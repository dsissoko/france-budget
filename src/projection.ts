import { expenses, revenues, offBudget, measures, type Category, type Measure } from './data';

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
export const rules: Record<string, Rule> = {
  'rn-vat': { kind: 'allocate', target: [{ side: 'revenues', categoryId: 'vat', share: 1 }], explanation: 'Baisse de recettes affectée à la TVA et consommation.' },
  'rn-social': { kind: 'specific', explanation: 'Projection interprétative : effet direct sur la protection sociale ; effets sur le marché du travail non quantifiés en V1.', assumption: 'Aucun effet automatique sur chômage, PIB, cotisations ou TVA.' },
  'rn-agencies': { kind: 'allocate', target: [{ side: 'expenses', categoryId: 'general', share: 1 }], explanation: 'Économie affectée par approximation aux services publics généraux.' },
  'lfi-wealth': { kind: 'allocate', target: [{ side: 'revenues', categoryId: 'property', share: 1 }], explanation: 'Recettes nouvelles affectées aux prélèvements sur le patrimoine.' },
  'lfi-school': { kind: 'allocate', target: [{ side: 'expenses', categoryId: 'education', share: 1 }], explanation: 'Dépense affectée à la fonction enseignement.' },
  'lfi-green': { kind: 'allocate', target: [{ side: 'expenses', categoryId: 'environment', share: 0.4 }, { side: 'expenses', categoryId: 'economy', share: 0.6 }], explanation: 'Répartition conventionnelle 40 % environnement, 60 % économie/transports ; aucun fondement comptable officiel.' },
  'hor-admin': { kind: 'allocate', target: [{ side: 'expenses', categoryId: 'general', share: 1 }], explanation: 'Économie indicative sur les services publics généraux.' },
  'hor-tax': { kind: 'allocate', target: [{ side: 'revenues', categoryId: 'otherTax', share: 1 }], explanation: 'Baisse de recettes affectée aux autres impôts, faute de ventilation précise.' },
};
const round = (n: number) => Math.round(n * 100) / 100;
const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);
const baseline = (items: Category[]) => Object.fromEntries(items.map(c => [c.id, c.amount]));
const categoryExists = (side: Side, id: string) => (side === 'revenues' ? revenues : side==='expenses'?expenses:offBudget).some(c => c.id === id);

/** 
 * Point d'extension des règles spécifiques : ici une approximation directe seulement.
 * Un futur modèle macro peut calculer plusieurs écritures et expliciter ses hypothèses.
 */
function specific(measure: Measure): Entry[] {
  switch (measure.id) {
    case 'rn-social':
      return [{ measureId: measure.id, side: 'expenses', categoryId: 'social', amount: measure.expenseDelta,
        rationale: 'Économie imputée à la protection sociale ; effets indirects sur emploi et recettes exclus.' }];
    default:
      throw new Error('Règle spécifique non implémentée : ' + measure.id);
  }
}
export function projectMeasure(measure: Measure): Entry[] {
  // En production, l'affectation APU est une donnée explicite et stable.
  // Les anciennes règles V1 ne servent que de repli pour les scénarios historiques.
  if(measure.apuEntries !== undefined){
    if(!Array.isArray(measure.apuEntries)||measure.apuEntries.length===0)
      throw new Error('Affectation APU absente : '+measure.id);
    const entries=measure.apuEntries.map(entry=>{
      if(!['revenues','expenses'].includes(entry.side)||!categoryExists(entry.side,entry.categoryId)||!Number.isFinite(entry.amount))
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
  // Une mesure chargée depuis Neon ne peut jamais revenir aux règles historiques locales.
  if (measure.referenceOrigin === 'neon') throw new Error('Affectation APU Neon absente : ' + measure.id);
  const rule = rules[measure.id];
  if (!rule) throw new Error('Règle absente pour ' + measure.id);
  if (rule.kind === 'specific') return specific(measure);
  const targets = rule.target || [];
  if (!targets.length) throw new Error('Ventilation vide : ' + measure.id);
  const shares = targets.reduce((a, t) => a + t.share, 0);
  if (Math.abs(shares - 1) > 0.000001) throw new Error('Parts non équilibrées : ' + measure.id);
  return targets.map(t => {
    if (!categoryExists(t.side, t.categoryId)) throw new Error('Catégorie inconnue : ' + t.categoryId);
    // An off-budget advantage is the inverse of an explicitly claimed tax/social revenue change.
    const amount = (t.side === 'offBudget' ? -measure.revenueDelta : t.side === 'revenues' ? measure.revenueDelta : measure.expenseDelta) * t.share;
    return { measureId: measure.id, side: t.side, categoryId: t.categoryId, amount,
      rationale: rule.explanation };
  });
}
/**
 * Écritures sourcées, déjà validées par le regroupement documentaire.
 * Facultatives : tous les anciens appels calculent exactement comme auparavant.
 */
export type SourcedEntry = Entry;
export function calculateScenario(
 selectedIds: string[],
 citizen: Override = { revenues: {}, expenses: {} },
 sourcedEntries: ReadonlyArray<SourcedEntry> = [],
): Result {
  const revenueValues = baseline(revenues), expenseValues = baseline(expenses), offBudgetValues=baseline(offBudget);
  const entries: Entry[] = [];
  const warnings: string[] = [];
  for (const id of new Set(selectedIds)) {
    const measure = measures.find(m => m.id === id);
    if (!measure) { warnings.push('Mesure inconnue ignorée : ' + id); continue; }
    try {
      const projected = projectMeasure(measure);
      entries.push(...projected);
      if (measure.status === 'illustration') warnings.push('Chiffrage fictif : ' + measure.title);
      if (!measure.apuEntries && rules[measure.id]?.kind === 'specific') warnings.push('Hypothèse spécifique : ' + rules[measure.id].explanation);
    } catch (err) {
      // Un budget documenté doit être cohérent en entier : jamais de solde
      // partiel si une écriture APU a été corrompue ou mal renseignée.
      if (measure.apuEntries !== undefined || measure.referenceOrigin === 'neon') throw err;
      warnings.push(String(err));
    }
  }
  // Fail closed : une affectation sourcée invalide annule entièrement
  // l'extension documentaire ; ne jamais comptabiliser un sous-ensemble silencieux.
  const existingMeasureIds=new Set(selectedIds);
  const validSourced=sourcedEntries.every(entry=>
    Boolean(entry.measureId) && !existingMeasureIds.has(entry.measureId) &&
    Boolean(entry.rationale?.trim()) &&
    Number.isFinite(entry.amount) && categoryExists(entry.side,entry.categoryId)
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
  const originalBalance = sum(baseline(revenues)) - sum(baseline(expenses));
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
export function auditMeasure(measure: Measure): Audit {
  const claimBalanceDelta = round(measure.revenueDelta - measure.expenseDelta);
  let entries: Entry[] = [];
  try {
    entries = projectMeasure(measure);
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
export function auditSelected(ids: string[]): Audit[] {
  return [...new Set(ids)].flatMap(id => {
    const measure = measures.find(m => m.id === id);
    return measure ? [auditMeasure(measure)] : [];
  });
}
