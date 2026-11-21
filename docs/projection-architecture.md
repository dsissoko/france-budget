# Architecture du moteur de projection et de qualification

## Objectif et frontières

**Un monolithe TypeScript modulaire, quatre responsabilités métier, aucun microservice ni nouvelle infrastructure.** Les quatre vues React restent stables et consomment un résultat de calcul unique. Cette architecture prépare des modèles économiques optionnels, sans en livrer maintenant.

Le calcul annuel actuel est conservé, y compris les règles de ventilation et leurs limites. La trajectoire V1 est une **illustration mécanique** : déficit de référence 2025 prolongé linéairement en facteur `1 + 0,025 × (année - 2025)` (et non croissance composée) ; écart annuel de solde **nul en 2025 et 2026** puis constant de 2027 à 2032. Ce n'est pas une prévision économique ni un modèle de dette.

## Responsabilités et dépendances

```text
Neon (données, scénarios, hypothèses futures)
        │
        ▼
AccountingService  ◄────────────── SimulationService
  recettes/dépenses                   orchestre les années
  ventilation/solde  ────────►        et appelle ImpactService
                                          │
                                          ▼
                                    ImpactService
                                 modèle V1 = aucun effet
                                 points d'extension futurs
                                          │
                                          ▼
                                    séries annuelles
                                          │
                                          ▼
                                    AssessmentService
                                 direction / accélération /
                                 qualification métier
                                          │
                                          ▼
                                   ProjectionResult
                                          │
                                          ▼
                              React : affichage uniquement
```

- **AccountingService** : encapsule la projection comptable annuelle existante (`calculateScenario`, ventilation, audits), sans modifier les montants.
- **SimulationService** : génère les huit points 2025–2032, avec les hypothèses V1 explicites ; il pourra coordonner des modèles annuels plus riches.
- **ImpactService** : interface d'extension et implémentation `no-op` initiale. Une future baisse de coût de financement pourrait dépendre d'un modèle de prime de risque, de l'échéancier de dette et d'autres hypothèses ; ne pas coder cette causalité avant validation scientifique.
- **AssessmentService** : évalue **la trajectoire du scénario**, pas seulement son écart à la référence ; retourne des codes métier stables, testables, sans connaissances React.

## Calendrier métier explicite

| Dimension | Valeur V1 | Sens |
| --- | --- | --- |
| `referenceYear` | **2025** | Comptes publics de référence (agrégats APU) ; ventilations pédagogiques |
| `budgetYear` | **2027** | Exercice budgétaire simulé, distinct du millésime des sources des mesures |
| `applicationYear` | **2027** | Première année d'imputation des effets de toutes les mesures V1 |
| `horizonYear` | **2032** | Horizon politique de comparaison, correspondant à la fin du prochain quinquennat présidentiel |

On affiche **2025–2032 inclus** : 2025 est la référence, 2026 une année mécanique sans mesure, 2027–2032 la période simulée. Le budget 2027 est habituellement préparé et examiné en 2026, **avant** l'élection présidentielle du printemps 2027 ; **2027 ne doit donc pas être présenté comme une année intégralement gouvernée par un programme élu en 2027**. Par ailleurs, 2032 est l'année du changement de quinquennat, pas une année budgétaire intégralement sous le même président. L'horizon 2032 reste un marqueur conventionnel de fin de cycle politique.

Les chiffrages RN et LFI cités proviennent en partie de **contre-budgets 2026** : les transposer à un exercice fictif 2027 est une hypothèse pédagogique, pas une revendication officielle pour 2027. Le `year` d'une mesure indique son **millésime source**, non sa date d'application. Les calendriers de montée en charge (ex. mesure annoncée « dès 2028 ») ne sont **pas** simulés : toute mesure sélectionnée est appliquée à partir de 2027, à montant annuel constant, jusqu'en 2032.

Les quatre valeurs du calendrier sont centralisées dans `src/engine/simulation.ts` (`PROJECTION_CALENDAR`), que l'interface ne redéfinit pas. La qualification des pentes ignore le saut d'application **2026 → 2027** et s'appuie sur la tendance post-2027.

Le sens des dépendances doit rester à sens unique : aucun module métier n'importe React, Recharts ou une feuille CSS. Les services n'accèdent pas directement à Neon ; le chargement des paramètres est une responsabilité de composition.

## Contrat et extensibilité

```ts
type ProjectionResult = {
  modelId: string;
  assumptions: { baselineRatePerIndex: number; referenceYear: number; budgetYear: number; applicationYear: number; horizonYear: number };
  rows: { year: number; reference: number; scenario: number }[];
  assessment: {
    code: QualificationCode;
    direction: 'increasing' | 'stable' | 'decreasing';
    momentum: 'accelerating' | 'steady' | 'decelerating';
  };
  warnings: string[];
}
```

La même logique de simulation alimente Comprendre, Mon budget, Voter et Comparer (deux résultats A/B partageant une référence). Un futur modèle peut varier les valeurs annuelles, mais pas le format de sortie ; les vues n'auront pas à recalculer la tendance. Les libellés français et les couleurs sont une table de présentation associée aux codes métier.

## Qualification publique de la trajectoire à l'horizon 2032

La **qualification publique** est produite par `src/engine/projection-verdict.ts`. Elle combine le **déficit du scénario en 2032 par rapport à la référence en 2032** et sa **pente après l'activation des mesures (2027–2032)**. Les montants positifs représentent des déficits, les montants négatifs des excédents.

| Label public | Couleur | Critère |
| --- | --- | --- |
| **Redressement** | Vert | Déficit 2032 strictement inférieur à la référence, avec pente post-2027 non montante **ou** équilibre/excédent atteint en 2032 |
| **Amélioration relative** | Orange | Déficit 2032 strictement inférieur à la référence, mais encore déficitaire en 2032 avec pente post-2027 montante |
| **Dégradation** | Rouge | Déficit 2032 strictement supérieur à la référence ; ou égal à la référence avec pente montante (cas du référentiel projeté) |
| **Non qualifié** (cas de bord) | Gris | Données insuffisantes ; ou écart nul avec pente non montante |

Un seuil de **0,1 Md€** (ou `assessment.changeThreshold` si configuré) tient compte de l'arrondi des valeurs affichées. La pente est calculée entre le point de début de la phase post-application et celui de fin, sans confondre le choc initial d'application et une diminution durable. Les chiffres de **déficit évité / supplémentaire** décrivent uniquement l'écart **2032** et restent visibles séparément.

**La référence n'est pas neutre en soi :** puisque la projection mécanique actuelle est haussière, son label est « Dégradation ». Cette classification publique est synthétique, ne constitue ni prévision ni certification économique, et ne modifie aucune donnée.

### Classification technique conservée

`AssessmentService` continue de produire des codes internes (`SURPLUS_REACHED`, `BALANCE_REACHED`, `DEFICIT_RETURNED`, `SURPLUS_TO_BALANCE`, `BALANCE_STABLE`, `SURPLUS_STABLE`, `DEFICIT_DECREASING`, `INCREASE_DECELERATING`, `DEFICIT_STABLE`, `INCREASE_STEADY`, `INCREASE_ACCELERATING`, `UNDETERMINED`). Ils analysent **la trajectoire propre du scénario**, indépendamment de la référence ; les anciens textes « En bonne voie », « Stagnation », « Hausse persistante », etc., restent historiques dans la table de présentation technique mais **ne servent plus de verdict public**.

Les détails exhaustifs des **labels affichés** et des **statuts documentaires** sont décrits dans [Notre méthode](methode.md#lecture-des-labels-de-projection-en-2032).

## Présentation ultra-compacte : slopegraph (2025 → 2032)

- `DeficitTrajectory` est l'unique composant partagé entre **Comprendre, Comparer, Mon budget, Voter**.
- Vue de référence (Comprendre) : une ligne grise. Projection d'un budget : **référence grise + scénario coloré**. Comparer : **référence + A (plein) + B (tireté)**.
- Valeurs tracées issues du **SimulationService** uniquement : points 2025, 2026, 2027 et 2032 ; saut des mesures réellement visible en 2027, pas de transition faussement progressive entre 2025 et l'application.
- Repères textuels **2025 · 2027 · 2032**, sans labels débordant sur mobile. L'échelle Y est resserrée à la plage des valeurs visibles et **identique à toutes les séries du même graphique** ; ce zoom est explicitement signalé et ne doit pas être interprété comme une importance relative.
- Sous le slopegraph, résultat **2032** : valeur de la référence et, pour chaque budget, montant final, effet vs référence et **qualification intrinsèque** (p. ex. « Hausse persistante » malgré un déficit inférieur à la référence).
- La couleur de série distingue les budgets ; la couleur du label qualifie la tendance. Ce sont **deux sémantiques différentes**.
- Ne jamais déplacer artificiellement des lignes qui se recouvrent : lorsqu'un écart est très faible, la valeur chiffrée fait foi. Les descriptions accessibles reprennent les montants.
- L'intégralité des années et détails d'hypothèses restent présents dans le résultat moteur ; la dataviz n'invente ni nouveau calcul ni nouveau scénario.

## Non-objectifs de cette itération

Pas de nouvelle hypothèse économique, de dette/PIB, de taux, de rétroaction ou de modèle macro. **Depuis la rédaction initiale de ce document, la migration Neon des écritures APU a bien été réalisée** ; les détails sont dans [schema.md](schema.md). Pas de refonte des autres composants. Le README reste fonctionnel/métier ; les détails d'architecture et hypothèses demeurent dans `docs/`.

## Validation

1. Tests de parité point par point de la projection V1, y compris comparaison A/B, références et ajustements.
2. Tests de table pour toutes les qualifications, cas frontière et seuils.
3. Vérification du même composant sur Comprendre, Comparer, Mon budget et Voter, desktop et mobile.
4. `npm run check`, `npm test`, `npm run build`, puis preview Vercel et non-régression fonctionnelle avant fusion.

## Évolution de l'alimentation comptable — novembre 2026

Le principe V1 du moteur n'a pas changé. `AccountingService` délègue toujours à `calculateScenario`, mais ce dernier accepte facultativement des écritures `sourcedEntries`. Les mesures politiques actives peuvent être ventilées depuis `measure_accounting_entries` dans Neon, via `GET /api/reference` et `apuEntries` ; les règles `rules` historiques sont conservées seulement comme repli. Une écriture documentaire mal formée bloque le calcul plutôt que d'être ignorée silencieusement.

Le regroupement éditorial RN/LFI/Équinoxe est préparé dans des tables `_draft` non consommées par le parcours public ; `documented-budget.ts` fournit l'adaptateur facultatif mais ne signifie pas publication. Le périmètre APU et les **25 catégories** (dont les deux catégories « Autres ») restent inchangés. Document de référence : [schema.md](schema.md).
