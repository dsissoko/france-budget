# Moteur de projection — principes et validation

## Positionnement
Le moteur réalise des **interprétations pédagogiques**, non opposables. Il ne certifie ni la faisabilité d'une politique, ni ses effets macroéconomiques. Il rend explicite la transformation d'une proposition politique en écritures budgétaires.

## Chaîne de validation
1. Recueillir la **présentation défendue par le parti** (document officiel, millésime, page, intitulé, assiette, objectif, hypothèses, montant revendiqué).
2. Définir une **règle interprétative de projection** : allocation générique vers des postes canoniques, ou traitement spécifique codé.
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
Les contre-budgets 2026 répondent au **projet initial PLF/PLFSS 2026**, pas aux comptes publics effectivement exécutés en 2025. La référence V1 conserve les **totaux APU 2025 publiés avec une ventilation fictive par postes** : appliquer un montant revendiqué pour 2026 à cet exemple ne garantit pas qu'il soit transposable. Avant de présenter un déficit comparatif réel, charger et réconcilier les agrégats officiels et harmoniser le millésime.

## Contrat technique
`src/projection.ts` expose :
- `rules` : table des règles par mesure, type `allocate` ou `specific`.
- `projectMeasure` : calcule les écritures canoniques attribuées.
- `auditMeasure` : rapproche impact annoncé, impact ventilé et écart.
- `calculateScenario` : additionne les impacts et les ajustements manuels, retourne recettes/dépenses/solde/alertes.

Chaque mesure conserve son origine, sa présentation et son montant déclaré dans `src/data.ts`. Les règles ne changent jamais le sens du montant déclaré sans le signaler.

## Exemples de projection
- TVA énergie RN : −10,96 Md€ sur la recette `vat` ; solde : −10,96.
- Prestation sociale RN : −6,1 Md€ en dépense `social` ; solde : +6,1. Les impacts sur chômage/emploi/recettes sont explicitement **non modélisés**.
- Énergies renouvelables LFI : +10,6 Md€ de dépenses, ventilées conventionnellement 40 % `environment` et 60 % `economy`. Répartition interprétative, non revendiquée par le parti.
- Gratuité scolaire LFI : +3,6 Md€ sur `education`.

Les tests automatisés vérifient la conservation des montants et l'arithmétique des scénarios. Ils ne valident pas les hypothèses économiques.

## Limites reconnues
- Une égalité automatique sur une règle `allocate` est principalement un **contrôle d'intégrité des données**.
- Les effets indirects, les changements d'assiette, le comportement économique et les montées en charge sont exclus de la V1.
- Les programmes sont incomplets et leurs totaux publiés ne doivent pas être additionnés à leurs mesures détaillées.
- La V1 signale les interactions potentielles et les millésimes différents sans les résoudre.
- Les budgets canoniques doivent ultimement être définis par périmètre (APU / État / sécurité sociale), classification fonctionnelle et nature économique.
