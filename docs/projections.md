# Moteur de projection — principes et validation

## Positionnement
Le moteur réalise des **interprétations pédagogiques**, non opposables. Il ne certifie ni la faisabilité d'une politique, ni ses effets macroéconomiques. Il rend explicite la transformation d'une proposition politique en écritures budgétaires.

## Chaîne de validation
1. Recueillir la **présentation défendue par le parti** (document officiel, millésime, page, intitulé, assiette, objectif, hypothèses, montant revendiqué).
2. Définir une **ventilation APU explicite et contrôlée** : une ou plusieurs écritures par mesure, liées à une catégorie et un côté recettes/dépenses. Les règles codées subsistent uniquement comme repli historique.
3. Comparer **solde annoncé** et **somme des écritures projetées** : écart, règles et hypothèses.
4. Afficher le résultat avec les réserves et limites : « montant reproduit » n'implique pas « effet établi ».
5. Pour contrôler la validité des **hypothèses économiques**, il faut des données et un modèle distincts ; la V1 ne fait que le rapprochement comptable.

## Sources et références
- [Contre-budget RN 2026](https://rassemblementnational.fr/documents/GRN-CONTRE-BUDGET-2026.pdf), conférence du 23 octobre 2025 : montant annoncé 10,96 Md€ de baisse de TVA énergie, 6,1 Md€ d'économies sur certaines prestations, 7,7 Md€ sur agences/opérateurs. Sources pages 3 et 4 (pagination imprimée).
- [Contre-budget LFI 2026](https://lafranceinsoumise.fr/wp-content/uploads/2025/10/Budget-2026_LFI_web_pages.pdf) : 3,6 Md€ de gratuité des services scolaires et 10,6 Md€ de développement des filières françaises d'énergies renouvelables.
- `data/official-sources.json` conserve l'inventaire des programmes et des références (extraction partielle). Il ne constitue pas encore un jeu de données entièrement réconcilié.

## Hypothèses de calendrier publiées

- **Référence comptable : 2025** (totaux APU), ventilations pédagogiques et non certifiées.
- **Exercice simulé : budget 2027**, **effets comptabilisés dès 2027**, prolongés annuellement à montant constant jusqu'en **2032**, horizon conventionnel de fin du prochain quinquennat.
- **Année 2026 : aucun effet des mesures simulées** ; seule la référence mécanique évolue.
- **Hypothèse de référence :** chaque année, déficit de 2025 × [1 + 0,025 × (année − 2025)] ; ceci n'est **pas** une croissance composée ni une prévision officielle.
- **Hypothèse politique :** 2027 est une année de transition présidentielle et le budget 2027 est élaboré en 2026. La simulation est un exercice citoyen contrefactuel, non un calendrier de mise en œuvre légalement ou politiquement garanti.
- **Millésimes sources ≠ année d'application :** les montants de contre-budgets RN/LFI 2026 sont repris à titre **illustratif** pour 2027. Aucune montée en charge, aucun effet indirect, aucune distinction de dates par mesure dans cette version.
- Les labels de tendance portent sur les variations annuelles **à partir de 2027**, en excluant le saut d'activation entre 2026 et 2027.

## Référence de comparaison
Les contre-budgets 2026 répondent au **projet initial PLF/PLFSS 2026**, pas aux comptes publics effectivement exécutés en 2025. La référence V1 conserve les **totaux APU 2025 publiés avec une ventilation indicative par postes** : appliquer un montant revendiqué pour 2026 à cet exemple ne garantit pas qu'il soit transposable. Avant de présenter un déficit comparatif réel, charger et réconcilier les agrégats officiels et harmoniser le millésime.

## Contrat technique
`src/projection.ts` expose :
- `rules` : table de **repli historique** par identifiant de mesure (non cible de production).
- `projectMeasure` : valide prioritairement les écritures APU reçues via l'API ; refuse les ventilations incohérentes.
- `auditMeasure` : rapproche impact annoncé, impact ventilé et écart.
- `calculateScenario` : additionne les impacts et les ajustements manuels, retourne recettes/dépenses/solde/alertes ; troisième paramètre `sourcedEntries` facultatif. Pour les groupes documentaires, voir `src/engine/documented-budget.ts` (non encore exposé au public).

Chaque mesure publiée est lue depuis Neon (`measures`) et ses écritures depuis `measure_accounting_entries`, restituées en `apuEntries`. `src/data.ts` ne constitue plus la source de vérité des mesures publiées. Les règles historiques restent disponibles pour les fixtures et anciens scénarios.

## Exemples de projection
- Proposition RN regroupée TVA énergie et produits essentiels : −14,46 Md€ de recettes sur `vat` (−10,96 et −3,5 revendiqués), soit −14,46 Md€ de solde avant effets indirects.
- Prestation sociale RN : −6,1 Md€ en dépense `social` ; solde : +6,1. Les impacts sur chômage/emploi/recettes sont explicitement **non modélisés**.
- Énergies renouvelables LFI : +10,6 Md€ de dépenses, ventilées conventionnellement 40 % `environment` et 60 % `economy`. Répartition interprétative, non revendiquée par le parti.
- Gratuité scolaire LFI : +3,6 Md€ sur `education`.

Les tests automatisés vérifient la conservation des montants et l'arithmétique des scénarios. Ils ne valident pas les hypothèses économiques.

## Manques à gagner hors budget de référence (2024)

Les allègements fiscaux et sociaux recensés dans le jaune **Aides publiques aux entreprises**, annexé au PLF 2027, sont des **postes de référence complémentaires**, et non des dépenses additionnelles. La référence APU 2025 active vaut 1 714,2 Md€ de dépenses, 1 561,7 Md€ de recettes et 152,5 Md€ de déficit.

- **Avantages fiscaux aux entreprises : 49,7 Md€ (2024)**, rattachés à la recette « Fiscalité des entreprises ».
- **Allègements de cotisations des entreprises : 69,1 Md€ (2024)**, rattachés à la recette « Cotisations sociales ».
- Les **43,3 Md€ d'aides budgétaires** et **4,0 Md€ d'équivalent-aide financier** figurent dans le breakdown descriptif officiel (166,1 Md€ au total), mais ne sont pas transformés en nouvelles dépenses ou recettes fictives. La ligne historique de dépenses « Soutien public aux entreprises » reste une enveloppe pédagogique de **30 Md€**, déjà comptée dans les 1 714,2 Md€ de référence 2025 ; elle n'est pas égale au total budgétaire recensé en 2024.

**Convention uniforme de simulation :** une catégorie hors budget possède un montant de référence et une catégorie de **recette de rattachement** (`revenueImpactCategory`). En scénario, sa nouvelle valeur est ajustable de **0 à 200 %** de sa référence, comme toute catégorie. La baisse de l'avantage (`nouveau - référence < 0`) entraîne mécaniquement **une hausse égale des recettes** ; son augmentation baisse les recettes, sans ajouter l'avantage au budget de référence. Exemple : avantage fiscal de 49,7 à 39,7 Md€ → +10 Md€ de fiscalité des entreprises, déficit réduit de 10 Md€. Les effets comportementaux, d'assiette, de croissance ou de négociation ne sont pas modélisés ; cette projection ne garantit pas le rendement effectif d'une réforme.

L'API et le moteur lisent ces catégories depuis la table séparée `reference_off_budget`. Les mesures citoyennes peuvent les utiliser et sont enregistrées dans `scenario.budget.offBudget` ; les anciens scénarios sans champ `offBudget` restent compatibles. Les budgets des partis, y compris ceux issus des documents 2026, restent inchangés tant qu'aucune mesure ne cible ce nouveau type.

Source : [Jaune budgétaire PLF 2027, aides publiques aux entreprises (exécution 2024)](https://www.budget.gouv.fr/documentation/file-download/34471).

## Limites reconnues
- Une égalité automatique sur une règle `allocate` est principalement un **contrôle d'intégrité des données**.
- Les effets indirects, les changements d'assiette, le comportement économique et les montées en charge sont exclus de la V1.
- Les programmes sont incomplets et leurs totaux publiés ne doivent pas être additionnés à leurs mesures détaillées.
- La V1 signale les interactions potentielles et les millésimes différents sans les résoudre.
- Les budgets canoniques doivent ultimement être définis par périmètre (APU / État / sécurité sociale), classification fonctionnelle et nature économique.

## État des données et contrôle des écritures — novembre 2026

- Codes de partis : `political_parties.code` et `budgets.party_code`, sans parser les titres.
- Écritures : `measure_accounting_entries(measure_id,line_number,side,category_id,amount)` liées aux catégories APU par FK ; leurs sommes doivent reproduire `measures.revenue_delta` et `expense_delta` pour les mesures calculées. Le contrôle d'égalité est effectué à la lecture dans l'API et dans le moteur, **pas encore par une contrainte SQL agrégative**.
- Les groupes documentaires RN/LFI/Équinoxe dans `party_proposal_draft` sont **non validés et non actifs** ; aucune somme brute ne doit être présentée comme déficit APU.
- Les mesures `non_chiffrable_apu` demandent une décision manuelle motivée. Les contributions non calculables restent documentées, pas intégrées dans le solde.
- La copie `measures.apu_entries` est **transitoire** : l'API lit la table normalisée, pas cette colonne.

Voir le [schéma technique réel](schema.md) et [l'architecture comptable](projection-architecture.md).
