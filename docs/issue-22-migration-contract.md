# Issue #22 — Migration des données de référence vers Neon

## Périmètre

L'application charge les catégories de recettes, de dépenses, les avantages hors budget et les mesures publiées depuis `GET /api/reference`, alimenté par les tables Neon `reference_categories`, `reference_off_budget`, `measures` et `measure_accounting_entries`.

Le moteur reçoit le référentiel chargé comme paramètre. L'interface ne modifie plus les tableaux de `src/data.ts` lors du chargement. Ces données locales restent des fixtures de tests et un support de compatibilité pour les appels historiques du moteur.

## Non-régression

- Contrôle de la cohérence des écritures APU (catégories, montants et réconciliation avec la mesure).
- Comparaison des cinq mesures RN/LFI publiées et de leurs six écritures APU.
- Comparaison du déficit de référence et des soldes RN/LFI entre les fixtures et le référentiel Neon.
- Vérification de l'absence de mutation du référentiel injecté.
- `npm run check`, `npm test` et `npm run build` exécutés par GitHub Actions.

**Écart connu :** Neon totalise 1 561,7 Md€ de recettes et 1 714,2 Md€ de dépenses, contre 1 561,6 et 1 714,1 dans les fixtures historiques. Les deux ajustements diffèrent de +0,1 Md€ ; le déficit reste 152,5 Md€ et les effets des mesures sont inchangés. Cet écart ne doit pas être présenté comme une stricte égalité des totaux bruts.

## Hors périmètre

Pas de SHA, de versionnement immuable, de snapshots historiques ni de refonte du modèle de publication. La PR reste en brouillon jusqu'à validation ; aucun merge ni déploiement en production n'est inclus.
