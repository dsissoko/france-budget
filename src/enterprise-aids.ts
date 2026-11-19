/** Source: « jaune » Aides publiques aux entreprises, PLF 2027, données 2024.
 * https://www.budget.gouv.fr/documentation/file-download/34471
 * These categories are informational baselines, NOT additions to the 2025 APU aggregates.
 */
export const ENTERPRISE_AIDS={
 year:2024,
 total:166.1,
 directBudget:43.3,
 fiscal:49.7,
 social:69.1,
 financial:4.0,
 source:'https://www.budget.gouv.fr/documentation/file-download/34471',
} as const;
export const OFF_BUDGET_ACCOUNTING_NOTE=
 'Montant hors budget de référence, présent comme avantage ou exonération déjà intégré aux recettes nettes. La simulation applique uniquement la variation du manque à gagner aux recettes publiques : baisse de l’avantage = recettes supplémentaires, hausse = recettes moindres. Hypothèse mécanique sans effet comportemental, ni ajustement de l’assiette.';
