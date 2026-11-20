# Issue #22 — Contrat de migration du modèle Neon (20 novembre 2026)

## État du référentiel

La source opérationnelle de la référence 2025 est PostgreSQL Neon : `reference_categories`, `reference_off_budget`, `measures` et `measure_accounting_entries`. L'API `GET /api/reference` expose les écritures normalisées, et refuse une mesure politique publiée si ses écritures ne sont pas complètes, cohérentes ou associées à une catégorie valide. Les regroupements documentaires non validés restent exclus du calcul.

Les six écritures observées sur la branche Neon isolée `issue-22-model-migration-2026-11-20` couvrent cinq mesures RN/LFI : `rn-vat` (TVA −14,46), `rn-social` (social −6,10), `rn-agencies` (général −8,213), `lfi-school` (éducation +3,60), `lfi-green` (environnement +4,24 ; économie +6,36), en Md€. Leur reproduction est testée dans `src/engine/normalized-entries.test.ts`.

## Divergence historique à préserver

La référence Neon 2025 donne 1 561,7 Md€ de recettes, 1 714,2 Md€ de dépenses, déficit 152,5 Md€. La fixture historique `src/data.ts` donne respectivement 1 561,6 et 1 714,1 Md€, avec le même déficit. Ces deux états ne sont **pas interchangeables**. Il est interdit de réécrire les publications historiques en supposant que leurs catégories et leurs références sont identiques.

## Contrat de reproductibilité restant à implémenter avant clôture

1. Créer une identité immuable de version du modèle (identifiant, millésime, empreinte canonique des catégories et écritures, date de publication et provenance).
2. Enregistrer la version du modèle ou un instantané suffisant dans chaque budget publié ; les budgets historiques sans version doivent recevoir une politique de lecture explicite, sans migration silencieuse.
3. Rendre le moteur de calcul indépendant des tableaux globaux mutables importés de `src/data.ts` : lui fournir explicitement le référentiel chargé et la version de calcul.
4. Rejouer des budgets RN/LFI et citoyens sauvegardés avant/après migration sur les deux références, en comparant recettes, dépenses, déficit et ventilations ; traiter toute divergence non expliquée comme bloquante.
5. Exécuter ces vérifications sur la branche Neon isolée, puis obtenir une CI complète et une revue avant toute fusion. La migration SQL et la publication d'une version de référence ne doivent pas modifier la production sans autorisation.

## Sécurité et CI

- Une mesure Neon sans écritures ne doit pas utiliser les anciennes règles `rules` de `src/projection.ts`.
- Toute écriture invalide doit interrompre le scénario, et non être ignorée.
- Le `tsconfig.json` inclut `api/` pour que GitHub Actions contrôle aussi les fonctions TypeScript Vercel.
- La branche de PR reste séparée de `main`. Le merge et la mise en production sont des décisions distinctes.

Ce document décrit le périmètre effectivement vérifié et les critères encore ouverts ; il ne constitue pas une attestation de clôture de l'issue.
